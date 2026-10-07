import React, { createContext, ReactNode, useContext, useEffect, useState,} from 'react';
import { Platform } from 'react-native';
import Purchases, { CustomerInfo, PurchasesPackage,} from 'react-native-purchases';

const PREMIUM_ENTITLEMENT_ID = 'premium';

type PremiumContextType = {
    isPremium: boolean;
    isLoadingPremium: boolean;
    purchasePremium: () => Promise<boolean>;
    restorePurchases: () => Promise<boolean>;
    refreshPremiumStatus: () => Promise<void>;
    removePremiumForTesting: () => void;
};

const PremiumContext = createContext<PremiumContextType | undefined>(undefined);

type PremiumProviderProps = {
    children: ReactNode;
};

const hasPremiumEntitlement = (customerInfo: CustomerInfo) => {
    return (
        customerInfo.entitlements.active[PREMIUM_ENTITLEMENT_ID] !== undefined
    );
};

export function PremiumProvider({ children }: PremiumProviderProps) {
    const [isPremium, setIsPremium] = useState(false);
    const [isLoadingPremium, setIsLoadingPremium] = useState(true);
    const [premiumDisabledForTesting, setPremiumDisabledForTesting] = useState(false);

    const removePremiumForTesting = () => setPremiumDisabledForTesting(true);

    const refreshPremiumStatus = async () => {
        try {
            const customerInfo = await Purchases.getCustomerInfo();
            setIsPremium(hasPremiumEntitlement(customerInfo));
        } catch (error) {
            console.warn('Could not refresh Premium status:', error);
        } finally {
            setIsLoadingPremium(false);
        }
    };

    const purchasePremium = async (): Promise<boolean> => {
        try {
            const offerings = await Purchases.getOfferings();
            const currentOffering = offerings.current;

            if (!currentOffering) {
                console.warn('No RevenueCat offering is currently available.');
                return false;
            }

            const premiumPackage: PurchasesPackage | undefined = currentOffering.availablePackages[0];

            if (!premiumPackage) {
                console.warn('No Premium package is currently available.');
                return false;
            }

            const { customerInfo } = await Purchases.purchasePackage(premiumPackage);

            const premiumActive = hasPremiumEntitlement(customerInfo);
            setIsPremium(premiumActive);
            if (premiumActive) setPremiumDisabledForTesting(false);

            return premiumActive;
        } catch (error: any) {
        if (!error?.userCancelled) {
            console.warn('Premium purchase failed:', error);
        }

        return false;
        }
    };

    const restorePurchases = async (): Promise<boolean> => {
        try {
            const customerInfo = await Purchases.restorePurchases();
            const premiumActive = hasPremiumEntitlement(customerInfo);

            setIsPremium(premiumActive);
            if (premiumActive) setPremiumDisabledForTesting(false);

            return premiumActive;
        } catch (error) {
            console.warn('Could not restore purchases:', error);
            return false;
        }
    };

    useEffect(() => {
        const configureRevenueCat = async () => {
            try {
                const apiKey =
                Platform.OS === 'ios'
                    ? process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY
                    : process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY;

                if (!apiKey) {
                    console.warn(
                        `RevenueCat API key is missing for ${Platform.OS}.`,
                    );
                    setIsLoadingPremium(false);
                    return;
                }

                Purchases.configure({ apiKey });

                await refreshPremiumStatus();
            } catch (error) {
                console.warn('RevenueCat initialization failed:', error);
                setIsLoadingPremium(false);
            }
        };
        void configureRevenueCat();
    }, []);

    return (
        <PremiumContext.Provider
            value={{
                isPremium: isPremium && !premiumDisabledForTesting,
                isLoadingPremium,
                purchasePremium,
                restorePurchases,
                refreshPremiumStatus,
                removePremiumForTesting,
            }}
        >
        {children}
        </PremiumContext.Provider>
    );
}

export function usePremium() {
    const context = useContext(PremiumContext);

    if (!context) {
        throw new Error('usePremium must be used inside PremiumProvider');
    }

    return context;
}