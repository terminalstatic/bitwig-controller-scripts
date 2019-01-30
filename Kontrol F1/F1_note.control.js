loadAPI(7);

const HUE = 176;
const SATURATION = 177;
const BRIGHTNESS = 178;

const LOWEST_CC = 1;
const HIGHEST_CC = 119;

const CHANNEL_10 = 185

const PLAY_BUTTON = 26;
const PLAY_BUTTON_SHIFT = 67;

const ARRANGER_RECORD_BUTTON = 27
const ARRANGER_RECORD_BUTTON_SHIFT = 68

const ARRANGER_AUTOMATION = 28
const ARRANGER_AUTOMATION_SHIFT = 69

const VELOCITY_OFFSET_ROTARY = 41
const SEQ_VELOCITY_NOTE_ROTARY = 78

const PUSH_ROTARY = 42
const SEQ_PUSH_ROTARY = 79

let isPushed = false
let isSeqPushed = false

const PADS_SHIFT_START = 51
const PADS_SHIFT_END = 66
const SEQ_PAGE_0 = 74
const SEQ_PAGE_1 = 75
const SEQ_PAGE_2 = 76
const SEQ_PAGE_3 = 77

const PAN_ROTARY_START = 2;
const PAN_ROTARY_END = 5

const PAN_ROTARY_START_SHIFT = 43;
const PAN_ROTARY_END_SHIFT = 46;

const VOLUME_SLIDERS_START = 6;
const VOLUME_SLIDERS_END = 9;

const VOLUME_SLIDERS_START_SHIFT = 47;
const VOLUME_SLIDERS_END_SHIFT = 50;

const TOGGLE_RESOLUTION = 72

host.setShouldFailOnDeprecatedUse(true);

host.defineController("Native Instruments", "Traktor Kontrol F1 Note", "0.1", "395b468a-1c98-11e9-ab14-d663bd873d93", "terminal_static");

host.defineMidiPorts(1, 1);

let velocity = 127
let noteOffset = 0
let noteTable = []
let steps = []
let notesText = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
let currentSeqNote = 36
let currentSeqVelocity = 127

let resolution = [1, 2 / 3, 1 / 2, 1 / 3, 1 / 4, 1 / 6, 1 / 8, 1 / 12];
let resolutionText = [
    "1/4",
    "1/4t",
    "1/8",
    "1/8t",
    "1/16",
    "1/16t",
    "1/32",
    "1/32t"
];
let resolutionIndex = 4;
let seqPageIndex = 0;

function init() {
    transport = host.createTransport();

    noteIn = host.getMidiInPort(0).createNoteInput("", "?9????");
    noteIn.setShouldConsumeEvents(false);
    noteIn.setVelocityTranslationTable(initArray(velocity, 128))
    notesInit(noteTable)

    noteIn.setKeyTranslationTable(noteTable)
    host.getMidiInPort(0).setMidiCallback(onMidi0);
    userControls = host.createUserControls(HIGHEST_CC - LOWEST_CC + 1);

    for (let i = LOWEST_CC; i <= HIGHEST_CC; i++) {
        userControls.getControl(i - LOWEST_CC).setLabel("CC" + i);
    }

    sendMidi(CHANNEL_10, VELOCITY_OFFSET_ROTARY, velocity)

    cursorTrack = host.createCursorTrack(0, 0);

    cursorClip = host.createLauncherCursorClip(16, 128);
    cursorClip.setStepSize(resolution[resolutionIndex]);

    cursorClip.playingStep().markInterested()
    cursorClip.getLoopLength().markInterested()
    cursorClip.getPlayStart().markInterested()
    cursorClip.getPlayStop().markInterested()
    cursorClip.getShuffle().markInterested()

    cursorClip.color().markInterested()


    steps = new Array(16)
    for (let i = 0; i < steps.length; i++) {
        steps[i] = new Array(128)
    }

    cursorClip.addStepDataObserver(function (x, y, state) {
        println("x: " + x)
        println("y: " + y)
        println("state: " + state);

        steps[x][y] = state;
    })

    // Init Pads on shift page
    for (let i = PADS_SHIFT_START; i <= PADS_SHIFT_END; i++) {
        setPadColor(i, 0, 0, 0);
    }

    cursorTrack = host.createCursorTrack(0, 0);
    cursorDevice = cursorTrack.createCursorDevice();

    cursorDevice.hasDrumPads().markInterested();

    drumPadBank = cursorDevice.createDrumPadBank(16);

    println("F1 note control initialized!");
}

function onMidi0(status, data1, data2) {
    printMidi(status, data1, data2)
    if (data1 === PUSH_ROTARY) {
        if (data2 === 127) {
            isPushed = true
        } else {
            isPushed = false
        }
    }

    if (data1 === SEQ_PUSH_ROTARY) {
        if (data2 === 127) {
            isSeqPushed = true
        } else {
            isSeqPushed = false
        }
    }

    if (isChannelController(status)) {
        /*if (data1 >= LOWEST_CC && data1 <= HIGHEST_CC) {
            let index = data1 - LOWEST_CC;
            userControls.getControl(index).set(data2, 128);
        }*/
        if (handleTransport(status, data1, data2)) {
            return;
        } else if (data1 === VELOCITY_OFFSET_ROTARY && isPushed === false) {
            if (data2 === 127) {
                if (velocity > 0) {
                    velocity--;
                    noteIn.setVelocityTranslationTable(initArray(velocity, 128))
                    sendMidi(CHANNEL_10, data1, velocity)
                }
            } else if (data2 === 1) {
                if (velocity < 127) {
                    velocity++;
                    noteIn.setVelocityTranslationTable(initArray(velocity, 128))
                    sendMidi(CHANNEL_10, data1, velocity)
                }

            }
        } else if (data1 === VELOCITY_OFFSET_ROTARY && isPushed === true) {
            if (data2 === 127) {
                if (noteOffset > -36) {
                    noteOffset--
                    sendMidi(CHANNEL_10, VELOCITY_OFFSET_ROTARY, Math.abs(noteOffset))
                    setNoteTable(noteIn, noteTable, noteOffset)
                }
            } else if (data2 === 1) {
                if (noteOffset < 80) {
                    noteOffset++
                    sendMidi(CHANNEL_10, VELOCITY_OFFSET_ROTARY, Math.abs(noteOffset))
                    setNoteTable(noteIn, noteTable, noteOffset)
                }
            }
        } else if (data1 === SEQ_VELOCITY_NOTE_ROTARY && isSeqPushed === true) {
            if (data2 === 127) {
                if (currentSeqNote > 0) {
                    currentSeqNote--;
                }
            } else {
                if (currentSeqNote < 127) {
                    currentSeqNote++;
                }
            }
            sendMidi(CHANNEL_10, SEQ_PUSH_ROTARY, Math.abs(noteOffset))
            host.showPopupNotification(notesText[currentSeqNote % 12] + (parseInt(currentSeqNote / 12) - 2))
        } else if (data1 === SEQ_VELOCITY_NOTE_ROTARY && isSeqPushed === false) {
            if (data2 === 127) {
                if (currentSeqVelocity > 0) {
                    currentSeqVelocity--;
                }
            } else {
                if (currentSeqVelocity < 127) {
                    currentSeqVelocity++;
                }
            }
            host.showPopupNotification(currentSeqVelocity)
        } else if (data1 >= PADS_SHIFT_START && data1 <= PADS_SHIFT_END) {
            cursorClip.toggleStep(data1 - PADS_SHIFT_START, currentSeqNote, currentSeqVelocity)
        } else if (data1 === TOGGLE_RESOLUTION) {
            if (resolutionIndex < resolution.length - 1) {
                resolutionIndex++
            } else {
                resolutionIndex = 0
            }
            cursorClip.setStepSize(resolution[resolutionIndex])
            host.showPopupNotification(resolutionText[resolutionIndex])
        } else if (data1 >= SEQ_PAGE_0 && data1 <= SEQ_PAGE_3) {
            let localIndex = 3 - (SEQ_PAGE_3 - data1)
            println(localIndex)
            switch (localIndex) {
                case 0:
                    cursorClip.scrollStepsPageBackwards();
                    seqPageIndex--;
                    break;
                case 1:
                    break;
                case 2:
                    break;
                case 3:

                    cursorClip.scrollStepsPageForward();
                    seqPageIndex++;

                    break;
            }
        } else if ((data1 >= VOLUME_SLIDERS_START || data1 >= VOLUME_SLIDERS_START_SHIFT) &&
            (data1 <= VOLUME_SLIDERS_END || data1 <= VOLUME_SLIDERS_END_SHIFT)) {
            if (cursorDevice.hasDrumPads().get()) {
                drumPadBank.getItemAt(0).volume().set(data2, 128);
            }
        }
    }
}

function flush() {
    println("flush")

    if (cursorDevice.hasDrumPads) {
        println("Drum device")
    }
    //cursorClip.quantize(0.0000000001)

    /*if (cursorClip.playingStep().get() === -1) {
        for (let i = 0; i < 16; i++) {
            setPadColor(PADS_SHIFT_START + i, 0, 0, 0)
        }
    }*/

    let hsbColor = rgb2hsv(cursorClip.color().red(), cursorClip.color().green(), cursorClip.color().blue())
    for (let i = 0; i < steps.length; i++) {
        if (steps[i][currentSeqNote] === 2) {
            setPadColor(PADS_SHIFT_START + i, hsbColor.h, hsbColor.s, 95)
        } else if (steps[i][currentSeqNote] === 1) {
            setPadColor(PADS_SHIFT_START + i, hsbColor.h, hsbColor.s, 16)
            /*} else if (steps[i][2] <= 0) {
                setPadColor(PADS_SHIFT_START + i, 0, 0, 0)*/
        } else {
            setPadColor(PADS_SHIFT_START + i, 0, 0, 0)
        }
    }

    let step = cursorClip.playingStep().get()
    if (step === 0) {
        cursorClip.scrollStepsStepForward();
        cursorClip.scrollStepsStepBackwards();
    }
    //println((step >= 0 && step >= (seqPageIndex * 16) && step <= (seqPageIndex * 16) + 15))
    if (step >= 0 && step >= (seqPageIndex * 16) && step <= (seqPageIndex * 16) + 15) {
        //setBrightness(PADS_SHIFT_START + step, 127)
        if (PADS_SHIFT_START + step <= 127)
            setPadColor(PADS_SHIFT_START + step % 16, 0, 0, 127)

    }
}

function exit() {

}

function handleTransport(status, data1, data2) {
    if ((data1 === PLAY_BUTTON || data1 === PLAY_BUTTON_SHIFT) && !isPushed && !isSeqPushed) {
        transport.play();
        return true;
    } else if ((data1 === PLAY_BUTTON || data1 === PLAY_BUTTON_SHIFT) && (isPushed || isSeqPushed)) {
        transport.setPosition(0);
        return true;
    } else if ((data1 === ARRANGER_RECORD_BUTTON || data1 === ARRANGER_RECORD_BUTTON_SHIFT && !isPushed && !isSeqPushed)) {
        transport.record()
        return true;
    } else if ((data1 === ARRANGER_AUTOMATION || data1 === ARRANGER_AUTOMATION_SHIFT) && !isPushed && !isSeqPushed) {
        transport.toggleWriteArrangerAutomation()
        return true;
    } else if ((data1 === ARRANGER_AUTOMATION || data1 === ARRANGER_AUTOMATION_SHIFT) && (isPushed || isSeqPushed)) {
        transport.toggleWriteClipLauncherAutomation()
        transport.isClipLauncherOverdubEnabled().toggle();
        return true;
    }
    return false;
}

function notesInit(noteTable) {
    for (let i = 0; i < 128; i++) {
        noteTable.push(i)
    }
}

function setNoteTable(noteIn, table, offset) {
    for (let i = 0; i < 128; i++) {
        table[i] = offset + i;
        if (table[i] < 0 || table[i] > 127) {
            table[i] = -1;
        }
    }
    noteIn.setKeyTranslationTable(table);
}

function setBrightness(cc, b) {
    sendMidi(BRIGHTNESS, cc, b);
}

function setPadColor(cc, h, s, b) {
    sendMidi(HUE, cc, h);
    sendMidi(SATURATION, cc, s);
    sendMidi(BRIGHTNESS, cc, b);
}

function rgb2hsv(r, g, b) {
    r = r * 255;
    g = g * 255;
    b = b * 255;
    if (arguments.length === 1) {
        (g = r.g), (b = r.b), (r = r.r);
    }
    var max = Math.max(r, g, b),
        min = Math.min(r, g, b),
        d = max - min,
        h,
        s = max === 0 ? 0 : d / max,
        v = max / 255;

    switch (max) {
        case min:
            h = 0;
            break;
        case r:
            h = g - b + d * (g < b ? 6 : 0);
            h /= 6 * d;
            break;
        case g:
            h = b - r + d * 2;
            h /= 6 * d;
            break;
        case b:
            h = r - g + d * 4;
            h /= 6 * d;
            break;
    }

    return {
        h: h * 127,
        s: s * 127,
        v: v
    };
}

function rgba2rgb(RGB_background, RGBA_color) {
    var alpha = RGBA_color.a;

    return {
        r: (1 - alpha) * RGB_background.r + alpha * RGBA_color.r,
        g: (1 - alpha) * RGB_background.g + alpha * RGBA_color.g,
        b: (1 - alpha) * RGB_background.b + alpha * RGBA_color.b
    };
}