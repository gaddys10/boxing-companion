import { Platform } from 'react-native';
import { TestIds } from 'react-native-google-mobile-ads';

const android = {
    savedCardsPortrait: 'ca-app-pub-6228968095032196/7907495237',
    savedCardsLandscape: 'ca-app-pub-6228968095032196/9819342707',
    matchNotesNative: 'ca-app-pub-6228968095032196/5850363445',
    banner: 'ca-app-pub-6228968095032196/7107604796',
    rewarded: 'ca-app-pub-6228968095032196/6454987779',
};

const ios = {
    savedCardsPortrait: 'ca-app-pub-6228968095032196/5277637479',
    savedCardsLandscape: 'ca-app-pub-6228968095032196/2651474135',
    matchNotesNative: 'ca-app-pub-6228968095032196/5295829677',
    banner: 'ca-app-pub-6228968095032196/1254631986',
    rewarded: 'ca-app-pub-6228968095032196/6123815282',
};

const production = Platform.OS === 'ios' ? ios : android;

export const adUnits = {
    savedCardsPortrait: __DEV__ ? TestIds.NATIVE : production.savedCardsPortrait,
    savedCardsLandscape: __DEV__ ? TestIds.NATIVE : production.savedCardsLandscape,
    matchNotesNative: __DEV__ ? TestIds.NATIVE : production.matchNotesNative,
    banner: __DEV__ ? TestIds.BANNER : production.banner,
    rewarded: __DEV__ ? TestIds.REWARDED : production.rewarded,
};
