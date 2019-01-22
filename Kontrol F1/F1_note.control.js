loadAPI(7);

const HUE = 176;
const SATURATION = 177;
const BRIGHTNESS = 178;

const LOWEST_CC = 1;
const HIGHEST_CC = 119;

const CHANNEL_10 = 185
const VELOCITY_OFFSET_ROTARY = 41

const PUSH_ROTARY = 42
let isPushed = false

const PADS_SHIFT_START = 51
const PADS_SHIFT_END = 66

host.setShouldFailOnDeprecatedUse(true);

host.defineController("Native Instruments", "Traktor Kontrol F1 Note", "0.1", "395b468a-1c98-11e9-ab14-d663bd873d93", "terminal_static");

host.defineMidiPorts(1, 1);

let velocity = 127
let noteOffset = 0
let noteTable = []
let steps = []

let resolutions = [1, 2 / 3, 1 / 2, 1 / 3, 1 / 4, 1 / 6, 1 / 8, 1 / 12];


function init() {

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

    cursorClip = host.createLauncherCursorClip(32, 128);
    cursorClip.setStepSize(resolutions[2]);

    cursorClip.playingStep().markInterested()
    cursorClip.getLoopLength().markInterested()
    cursorClip.color().markInterested()

    steps = initArray(0, ((1 / resolutions[2]) * cursorClip.getLoopLength().get()))
    cursorClip.addStepDataObserver(function (x, y, state) {
        println("x: " + x)
        println("y: " + y)
        println("state: " + state);

        steps[x] = state;
        let hsbColor = rgb2hsv(cursorClip.color().red(), cursorClip.color().green(), cursorClip.color().blue())
        if (state > 0)
            setPadColor(PADS_SHIFT_START + x, hsbColor.h, hsbColor.s, 127)
        else
            setPadColor(PADS_SHIFT_START + x, 0, 0, 0)
    })

    // Init Pads on shift page
    for (let i = PADS_SHIFT_START; i <= PADS_SHIFT_END; i++) {
        setPadColor(i, 0, 0, 0);
    }

    println("qunexus initialized!");
}

function onMidi0(status, data1, data2) {
    printMidi(status, data1, data2)
    if (PUSH_ROTARY === 127) {
        isPushed = true
    } else {
        isPushed = false
    }
    if (isChannelController(status)) {
        /*if (data1 >= LOWEST_CC && data1 <= HIGHEST_CC) {
            let index = data1 - LOWEST_CC;
            userControls.getControl(index).set(data2, 128);
        }*/
        if (data1 === VELOCITY_OFFSET_ROTARY && isPushed === false) {
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
                    sendMidi(CHANNEL_10, VELOCITY_ROTARY, Math.abs(noteOffset))
                    setNoteTable(noteIn, noteTable, noteOffset)
                }
            }
        } else if (data1 >= PADS_SHIFT_START && data1 <= PADS_SHIFT_END) {
            cursorClip.toggleStep(data1 - PADS_SHIFT_START, 36, 127)
        }
    }
}

function flush() {
    //println(cursorClip.playingStep().get())
    let hsbColor = rgb2hsv(cursorClip.color().red(), cursorClip.color().green(), cursorClip.color().blue())
    for (let i = 0; i < steps.length; i++) {
        if (steps[i] > 0)
            setPadColor(PADS_SHIFT_START + i, hsbColor.h, hsbColor.s, 127)
        else
            setPadColor(PADS_SHIFT_START + i, 0, 0, 0)
    }

    let step = cursorClip.playingStep().get()
    if (step >= 0) {
        //setBrightness(PADS_SHIFT_START + step, 127)
        setPadColor(PADS_SHIFT_START + step, 0, 0, 127)
        if (step === 0) {
            if (steps[((1 / resolutions[2]) * cursorClip.getLoopLength().get()) - 1] > 0)
                setPadColor(PADS_SHIFT_START + ((1 / resolutions[2]) * cursorClip.getLoopLength().get()) - 1, hsbColor.h, hsbColor.s, 127)
            else
                setPadColor(PADS_SHIFT_START + ((1 / resolutions[2]) * cursorClip.getLoopLength().get()) - 1, 0, 0, 0)
        } else {
            if (steps[step - 1] > 0)
                setPadColor(PADS_SHIFT_START + step - 1, hsbColor.h, hsbColor.s, 127)
            else
                setPadColor(PADS_SHIFT_START + step - 1, 0, 0, 0)
        }
    }
}

function exit() {

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