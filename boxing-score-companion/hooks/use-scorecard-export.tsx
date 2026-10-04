import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Image, PixelRatio, Platform, StyleSheet, View } from 'react-native';
import { captureRef, releaseCapture } from 'react-native-view-shot';
import { getExportCanvasSize, type ExportImageFormat } from '../utils/export-image';

export type { ExportImageFormat } from '../utils/export-image';

type ExportResult = 'tmpfile' | 'data-uri';

type CaptureSession = {
    id: number;
    cancelled: boolean;
    reject: (error: Error) => void;
    timer: ReturnType<typeof setTimeout> | null;
    frames: number[];
    loaded: boolean;
    laidOut: boolean;
    waitingForFrames: boolean;
    ready?: () => void;
    renderError?: (error: Error) => void;
};

type ExportCanvas = {
    sessionId: number;
    sourceUri: string;
    sourceWidth: number;
    sourceHeight: number;
    width: number;
    height: number;
    pixelRatio: number;
};

const CAPTURE_TIMEOUT_MS = 20000;

function releaseTemporaryImage(uri: string) {
    try {
        releaseCapture(uri);
    } catch {
        // Temporary-file cleanup must not replace a capture error or a successful export.
    }
}

export function useScorecardExport(scorecardRef: React.RefObject<View | null>) {
    const canvasRef = useRef<View>(null);
    const sessionRef = useRef<CaptureSession | null>(null);
    const nextSessionIdRef = useRef(0);
    const mountedRef = useRef(true);
    const [canvas, setCanvas] = useState<ExportCanvas | null>(null);

    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
            const session = sessionRef.current;
            if (session) {
                session.cancelled = true;
                session.reject(new Error('The export screen was closed.'));
                session.frames.forEach(cancelAnimationFrame);
                if (session.timer !== null) clearTimeout(session.timer);
            }
        };
    }, []);

    const markRendered = useCallback((sessionId: number, stage: 'loaded' | 'laidOut') => {
        const session = sessionRef.current;
        if (!session || session.id !== sessionId || session.cancelled) return;
        session[stage] = true;
        if (
            !session.loaded || !session.laidOut || session.waitingForFrames
        ) return;

        session.waitingForFrames = true;
        session.frames.push(requestAnimationFrame(() => {
            if (sessionRef.current !== session || session.cancelled) return;
            session.frames.push(requestAnimationFrame(() => {
                if (sessionRef.current !== session || session.cancelled) return;
                session.frames = [];
                session.ready?.();
            }));
        }));
    }, []);

    const rejectRender = useCallback((sessionId: number) => {
        const session = sessionRef.current;
        if (session?.id === sessionId && !session.cancelled) {
            session.renderError?.(new Error('The scorecard image could not be loaded.'));
        }
    }, []);

    const captureExportCard = useCallback(async (
        result: ExportResult = 'tmpfile',
        format: ExportImageFormat = 'original',
    ): Promise<string> => {
        if (!mountedRef.current || !scorecardRef.current) {
            throw new Error('Export card is not ready yet.');
        }
        if (sessionRef.current) throw new Error('An image export is already in progress.');

        let rejectCapture: (error: Error) => void = () => {};
        const cancelled = new Promise<never>((_, reject) => { rejectCapture = reject; });
        const session: CaptureSession = {
            id: ++nextSessionIdRef.current,
            cancelled: false,
            reject: rejectCapture,
            timer: null,
            frames: [],
            loaded: false,
            laidOut: false,
            waitingForFrames: false,
        };
        sessionRef.current = session;
        session.timer = setTimeout(() => {
            session.cancelled = true;
            session.reject(new Error('The scorecard image took too long to prepare. Please try again.'));
        }, CAPTURE_TIMEOUT_MS);

        let sourceUri: string | null = null;
        try {
            if (format === 'original') {
                return await Promise.race([
                    captureRef(scorecardRef, { format: 'png', quality: 1, result }).then(uri => {
                        if (session.cancelled && result === 'tmpfile') releaseTemporaryImage(uri);
                        return uri;
                    }),
                    cancelled,
                ]);
            }

            sourceUri = await Promise.race([
                captureRef(scorecardRef, { format: 'png', quality: 1, result: 'tmpfile' }).then(uri => {
                    if (session.cancelled) releaseTemporaryImage(uri);
                    return uri;
                }),
                cancelled,
            ]);
            const { width: sourceWidth, height: sourceHeight } = await Promise.race([
                new Promise<{ width: number; height: number }>((resolve, reject) => {
                    Image.getSize(sourceUri!, (width, height) => resolve({ width, height }), reject);
                }),
                cancelled,
            ]);
            const { width, height } = getExportCanvasSize(sourceWidth, sourceHeight, format);
            const rendered = new Promise<void>((resolve, reject) => {
                session.ready = resolve;
                session.renderError = reject;
            });
            setCanvas({
                sessionId: session.id, sourceUri, sourceWidth, sourceHeight, width, height,
                pixelRatio: PixelRatio.get(),
            });
            await Promise.race([rendered, cancelled]);
            if (!canvasRef.current) throw new Error('The export canvas is not ready.');

            return await Promise.race([
                captureRef(canvasRef, {
                    format: 'png',
                    quality: 1,
                    result,
                    // iOS sizes are points and its renderer already applies the device pixel ratio.
                    ...(Platform.OS === 'ios'
                        ? { useRenderInContext: true }
                        : { width, height }),
                }).then(uri => {
                    if (session.cancelled && result === 'tmpfile') releaseTemporaryImage(uri);
                    return uri;
                }),
                cancelled,
            ]);
        } finally {
            session.cancelled = true;
            if (session.timer !== null) clearTimeout(session.timer);
            session.frames.forEach(cancelAnimationFrame);
            if (sourceUri) releaseTemporaryImage(sourceUri);
            if (sessionRef.current === session) {
                sessionRef.current = null;
                if (mountedRef.current) setCanvas(null);
            }
        }
    }, [scorecardRef]);

    const exportCanvas = canvas ? (
        <View
            key={canvas.sessionId}
            ref={canvasRef}
            collapsable={false}
            pointerEvents="none"
            accessible={false}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            onLayout={() => markRendered(canvas.sessionId, 'laidOut')}
            style={[
                styles.canvas,
                { width: canvas.width / canvas.pixelRatio, height: canvas.height / canvas.pixelRatio },
            ]}
        >
            <Image
                source={{ uri: canvas.sourceUri }}
                resizeMode="contain"
                style={{
                    width: canvas.sourceWidth / canvas.pixelRatio,
                    height: canvas.sourceHeight / canvas.pixelRatio,
                }}
                onLoad={() => markRendered(canvas.sessionId, 'loaded')}
                onError={() => rejectRender(canvas.sessionId)}
            />
        </View>
    ) : null;

    return { captureExportCard, exportCanvas };
}

const styles = StyleSheet.create({
    canvas: {
        position: 'absolute',
        left: 10000,
        top: 0,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
    },
});
