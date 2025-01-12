loadAPI(16);

host.defineController(
    "Faderfox",
    "Faderfox EC4 Sysex",
    "0.1",
    "6E999D8F-7F44-4468-ABD2-4AF4DA888937",
    "terminal_static"
);

host.defineMidiPorts(1, 1);

host.addDeviceNameBasedDiscoveryPair(
    ["Faderfox EC4"],
    ["Faderfox EC4"]
);

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

const SYSEX_HEADER = "F0 00 00 00 4E 2C 1B";
const CONTROL_DISPLAY = "4E 22 10";
const TOTAL_DISPLAY = "4E 22 13";
const SHOW_TOTAL_DISPLAY = "4E 22 14";
const HIDE_TOTAL_DISPLAY = "4E 22 15";
const POSITION = "4A";
const CHAR = "4D";
const END_SYSEX = "F7";

let setupOffset = 14-1;
let groupOffset = 3-1;

const SETUP = `4e 28 ${(0x10 + setupOffset).toString(16)}`;
const GROUP = `4e 24 ${(0x10 + groupOffset).toString(16)}`;

let cursorTrack;
let cursorDevice;
let remoteControls;

let midiOut;
let mode = 0;

function init() {

    cursorTrack = host.createCursorTrack('ec-4-cursor-track', 'Cursor Track', 0, 0, true);
    cursorDevice = cursorTrack.createCursorDevice();
    remoteControls = cursorDevice.createCursorRemoteControlsPage(8);

    host.getMidiInPort(0).setSysexCallback(onSysex);
    host.getMidiInPort(0).setMidiCallback(onMidi);

    midiOut = host.getMidiOutPort(0);

    const showTotal = `${SYSEX_HEADER} ${SHOW_TOTAL_DISPLAY} ${END_SYSEX}`;
    //midiOut.sendSysex("F0 00 00 00 4E 2C 1B 4E 22 13 4A 21 1C 4D 25 12 4D 26 15 4D 27 13 4D 26 1F 4E 22 14 F7");
    midiOut.sendSysex(showTotal);
    writeText(' '.repeat(80), 0, 3);
    writeText("Hello Human!", 24, 3);

    host.scheduleTask(() => {
        const hideTotal = `${SYSEX_HEADER} ${HIDE_TOTAL_DISPLAY} ${END_SYSEX}`;
        midiOut.sendSysex(hideTotal);
    }, 3000);


    writeText(dialLabels.map(row => row.join('')).join(''), 0);
    for (let i = 0; i < 8; i++) {
        let p = remoteControls.getParameter(i).getAmount();
        p.setIndication(true);
        p.name().markInterested();
        p.name().addValueObserver((value) => {
            println("Parameter " + (i + 1) + " value: " + value);
            let chompedVal = value.split(' ');
            chompedVal = chompedVal.length > 1 ? `${chompedVal[0][0]}${chompedVal[1].substring(0, 3)}` : chompedVal[0];

            chompedVal = chompedVal.length >= 4 ? chompedVal.substring(0, 4) : chompedVal.padEnd(4, ' ');
            println('-----------');
            println(chompedVal);
            println('-----------');
            dialLabels[parseInt(i / 4)][i % 4] = chompedVal;
            writeText(chompedVal, i * 4);
        });
        //let name = p.name().get();
        //println("Parameter " + (i + 1) + " name: " + name);
        p.setLabel("P" + (i + 1));
    }

    const identityRequest = "F0 7E 7F 06 01 F7"
    midiOut.sendSysex(identityRequest);
}

function sendSysex(data) {
    host.getMidiOutPort(0).sendSysex(data);
}

function writeText(text, offset, screen = 0) {
    let charsMap = [];
    for (let i = 0; i < text.length; i++) {
        const ascii = text.charCodeAt(i);
        let hexMap = [];
        hexMap.push(0x20 + parseInt(ascii / 16));
        hexMap.push(0x10 + (ascii % 16));
        const hexString = `${CHAR} ${hexMap.map(byte => byte.toString(16).toUpperCase()).join(' ')}`;
        charsMap.push(hexString);
    }

    const output = charsMap.join(' ');
    println(`Output: ${output}`);

    const msb = 0x20 + parseInt(offset / 16);
    const lsb = 0x10 + (offset % 16);

    const pos = `${POSITION} ${msb.toString(16)} ${lsb.toString(16)}`;

    let display = CONTROL_DISPLAY;
    switch (screen) {
        case 0:
            display = CONTROL_DISPLAY;
            break;
        case 3:
            display = TOTAL_DISPLAY;
            break;
    }

    const request = `${SYSEX_HEADER} ${display} ${pos} ${output} ${END_SYSEX}`;
    println(`Request: ${request}`);
    midiOut.sendSysex(request);
}

function onSysex(data) {
    println("Sysex received");
    println(data);
    const groupedData = data.match(/.{1,2}/g).join(' ');
    println(groupedData);

    const setupCHannel = `${SETUP} ${GROUP} ${END_SYSEX.toLowerCase()}`;
    println(setupCHannel);

    const isShiftDown = data == 'f00000004e2c1b4e26114e2e11f7';
    if (isShiftDown || groupedData.endsWith(setupCHannel)) {
        println("Shift down");
        if (isShiftDown) {
            mode == 0 ? mode = 1 : mode = 0;
        }

        let page;
        switch (mode) {
            case 0:
                page = dialLabels.map(row => row.join('')).join('');
                writeText(page, 0);
                break;
            case 1:
                page = BUTTON_LABELS.map(row => row.join('')).join('');
                writeText(page, 0);
                break;
        }
    }
    /*else if (data == 'f00000004e2c1b4e26114e2e10f7') {
        println(dialLabels);
        const page = dialLabels.map(row => row.join('')).join('');
        writeText(page, 0);
        println("Shift up");
    }*/
}

function onMidi(status, data1, data2) {
    println("Midi received");
    println(status);
    println(data1);
    println(data2);
}