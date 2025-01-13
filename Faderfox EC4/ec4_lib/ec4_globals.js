const BUTTON_LABELS = [
    ['PCLP', 'NCLP', 'UNDO', 'REDO'],
    ['PTRK', 'NTRK', 'PPAG', 'NPAG'],
    ['    ', '    ', 'PDEV', 'NDEV'],
    ['PLAY', 'STOP', 'REWI', 'RCLP'],
];

let dialLabels = [
    ['PRM1', 'PRM2', 'PRM3', 'PRM4'],
    ['PRM5', 'PRM6', 'PRM7', 'PRM8'],
    ['VOL ', 'PAN ', 'SND1', 'SND2'],
    ['SND3', 'SND4', 'SND5', 'SND6'],
];

const LOWEST_CC = 1;
const HIGHEST_CC = 119;

const DEVICE_START_CC = 16;
const DEVICE_END_CC = 23;


const SETUP_GROUP_STATUS = "F0 00 00 00 4E 20 10 F7";
const SYSEX_HEADER = "F0 00 00 00 4E 2C 1B";
const CONTROL_DISPLAY = "4E 22 10";
const TOTAL_DISPLAY = "4E 22 13";
const SHOW_TOTAL_DISPLAY = "4E 22 14";
const HIDE_TOTAL_DISPLAY = "4E 22 15";
const POSITION = "4A";
const CHAR = "4D";
const END_SYSEX = "F7";

let setupOffset;
let groupOffset;
let midiChannel;

let setup;
let group;

let currentSetup;
let currentGroup;

let app;
let trackBank;
let transport;
let cursorTrack;
let cursorDevice;
let remoteControls;
let clipLauncherSlotBank;

let midiOut;
let mode = 0;

var trackSelected = 0;
var slotSelected = 0;


