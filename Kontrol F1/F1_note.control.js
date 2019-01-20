loadAPI(7);

const LOWEST_CC = 1;
const HIGHEST_CC = 119;

const CHANNEL_10 = 185
const VELOCITY_ROTARY = 41
const NOTE_OFFSET_ROTARY = 78

host.setShouldFailOnDeprecatedUse(true);

host.defineController("Native Instruments", "Traktor Kontrol F1 Note", "0.1", "395b468a-1c98-11e9-ab14-d663bd873d93", "terminal_static");

host.defineMidiPorts(1, 1);

let velocity = 127
let noteOffset = 0
let noteTable = []

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

    sendMidi(CHANNEL_10, VELOCITY_ROTARY, velocity)
    sendMidi(CHANNEL_10, NOTE_OFFSET_ROTARY, noteOffset)
    println("qunexus initialized!");
}

function onMidi0(status, data1, data2) {
    printMidi(status, data1, data2)
    if (isChannelController(status)) {
        /*if (data1 >= LOWEST_CC && data1 <= HIGHEST_CC) {
            let index = data1 - LOWEST_CC;
            userControls.getControl(index).set(data2, 128);
        }*/
        if (data1 === VELOCITY_ROTARY) {
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
        } else if (data1 === NOTE_OFFSET_ROTARY) {
            if (data2 === 127) {
                if (noteOffset > -36) {
                    noteOffset--
                    sendMidi(CHANNEL_10, NOTE_OFFSET_ROTARY, Math.abs(noteOffset))
                    setNoteTable(noteIn, noteTable, noteOffset)
                }
            } else if (data2 === 1) {
                if (noteOffset < 80) {
                    noteOffset++
                    sendMidi(CHANNEL_10, NOTE_OFFSET_ROTARY, Math.abs(noteOffset))
                    setNoteTable(noteIn, noteTable, noteOffset)
                }
            }


        }
    }
}

function flush() {


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