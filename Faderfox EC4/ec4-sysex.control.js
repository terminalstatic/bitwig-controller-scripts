loadAPI(16);

load('ec4_lib/ec4_globals.js');
load('ec4_lib/ec4_sysex.js');
load('ec4_lib/ec4_midi.js');

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


function init() {
    const preferences = host.getPreferences();
    const ec4MidiChannel = preferences.getEnumSetting("MIDI Channel", "MIDI Channel", ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16"], "16");
    const ec4Setup = preferences.getEnumSetting("Faderfox Setup", "Faderfox Setup", ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16"], "14");
    const ec4Group = preferences.getEnumSetting("Faderfox Group", "Faderfox Group", ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16"], "3");


    ec4MidiChannel.addValueObserver(function (value) {
        midiChannel = value;
    });

    ec4Setup.addValueObserver(function (value) {
        setupOffset = parseInt(value) - 1;
        setup = (0x10 + setupOffset).toString(16);
    });

    ec4Group.addValueObserver(function (value) {
        groupOffset = parseInt(value) - 1;
        group = (0x10 + groupOffset).toString(16);
    });

    host.getMidiInPort(0).setSysexCallback(onSysex);
    host.getMidiInPort(0).setMidiCallback(onMidi);

    midiOut = host.getMidiOutPort(0);

    //set to configured setup and group
    currentSetup = (0x10 + parseInt(ec4Setup.get() - 1)).toString(16);
    currentGroup = (0x10 + parseInt(ec4Group.get() - 1)).toString(16);

    sendSysex(`${SYSEX_HEADER} 4E 28 ${currentSetup} 4E 24 ${currentGroup} ${END_SYSEX}`);

    // controls init start
    transport = host.createTransport();

    app = host.createApplication();
    cursorTrack = host.createCursorTrack('ec-4-cursor-track', 'Cursor Track', 6, 0, true);

    trackBank = host.createTrackBank(128, 0, 128);
    trackBank.followCursorTrack(cursorTrack);

    trackBank.cursorIndex().markInterested();
    trackBank.itemCount().markInterested();
    trackBank.channelCount().markInterested();
    trackBank.channelScrollPosition().markInterested();

    /*trackBank.channelCount().addValueObserver((count) => {
      println(`Track count: ${count}`);
    });*/

    /*trackBank.channelScrollPosition().addValueObserver((position) => {
      println(`Track position: ${position}`);
    });*/

    trackBank.cursorIndex().addValueObserver((index) => {
        trackSelected = index;
        if (trackSelected >= 0) {
            const slotBank = trackBank.getItemAt(trackSelected).clipLauncherSlotBank();
            slotBank.select(slotSelected);
        }
    });

    for (let t = 0; t < trackBank.getSizeOfBank(); t++) {
        let track = trackBank.getItemAt(t);


        clipLauncherSlotBank = track.clipLauncherSlotBank();
        clipLauncherSlotBank.setIndication(true);

        for (let s = 0; s < clipLauncherSlotBank.getSizeOfBank(); s++) {
            let clipSlot = clipLauncherSlotBank.getItemAt(s);

            clipSlot.isSelected().addValueObserver(function (isSelected) {
                if (isSelected) {
                    trackSelected = t;
                    slotSelected = s;
                }
            });
        }
    }


    cursorDevice = cursorTrack.createCursorDevice();
    remoteControls = cursorDevice.createCursorRemoteControlsPage(8);


    for (let i = 0; i < 8; i++) {
        let p = remoteControls.getParameter(i).getAmount();
        p.setIndication(true);
        p.setLabel("P" + (i + 1));
    }

    // controls init end
    const showTotal = `${SYSEX_HEADER} ${SHOW_TOTAL_DISPLAY} ${END_SYSEX}`;

    midiOut.sendSysex(showTotal);
    writeText(' '.repeat(80), 0, 3);
    writeText("Hello Human!", 24, 3);

    host.scheduleTask(() => {
        const hideTotal = `${SYSEX_HEADER} ${HIDE_TOTAL_DISPLAY} ${END_SYSEX}`;
        midiOut.sendSysex(hideTotal);
    }, 3000);

    //sendSysex(SETUP_GROUP_STATUS);

    for (let i = 0; i < 8; i++) {
        let p = remoteControls.getParameter(i).getAmount();
        p.setIndication(true);
        p.name().markInterested();
        p.name().addValueObserver((value) => {
            let chompedVal = value.split(' ');
            chompedVal = chompedVal.length > 1 ? `${chompedVal[0][0]}${chompedVal[1].substring(0, 3)}` : chompedVal[0];

            chompedVal = chompedVal.length >= 4 ? chompedVal.substring(0, 4) : chompedVal.padEnd(4, ' ');

            dialLabels[parseInt(i / 4)][i % 4] = chompedVal;
            if (mode === 0) {
                writeText(dialLabels.map(row => row.join('')).join(''), 0);
            }
        });
        p.setLabel("P" + (i + 1));
    }

    const identityRequest = "F0 7E 7F 06 01 F7"
    midiOut.sendSysex(identityRequest);

    println("ec4 initialized!");
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

    midiOut.sendSysex(request);
}