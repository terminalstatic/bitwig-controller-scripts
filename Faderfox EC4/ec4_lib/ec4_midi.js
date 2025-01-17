function isInDeviceParametersRange(cc) {
    return cc >= DEVICE_START_CC && cc <= DEVICE_END_CC;
}

function onMidi(status, data1, data2) {
    printMidi(status, data1, data2);
    //println(MIDIChannel(status));
    const channel = (status & 0x0F) + 1;

    if (channel == midiChannel) {
        if (data1 == 24) {
            cursorTrack.volume().set(data2, 128);
        }
        else if (data1 == 36 && data2 > 0) {
            cursorTrack.volume().reset();
        }
        else if (data1 == 25) {
            cursorTrack.pan().set(data2, 128);
        } else if (data1 == 37 && data2 > 0) {
            cursorTrack.pan().reset();
        } else if ((data1 >= 26 && data1 <= 27) || (data1 >= 28 && data1 <= 31)) {
            cursorTrack.sendBank().getItemAt(data1 - 26).set(data2, 128);
        } else if (mode === 0 && data1 >= 38 && data1 <= 39 && data2 > 0) {
            cursorTrack.sendBank().getItemAt(data1 - 38).reset();
        } else if (mode === 0 && data1 >= 32 && data1 <= 35 && data2 > 0) {
            cursorTrack.sendBank().getItemAt(data1 + 2 - 32).reset();
        }
        else if (mode === 0 && data1 >= 44 && data1 <= 47 && data2 > 0) {
            remoteControls.getParameter(data1 - 44).reset();
        }
        else if (mode === 0 && data1 >= 40 && data1 <= 43 && data2 > 0) {
            remoteControls.getParameter(data1 + 4 - 40).reset();
        }
        else if (isInDeviceParametersRange(data1)) {
            let index = data1 - DEVICE_START_CC;
            remoteControls
                .getParameter(index)
                .getAmount()
                .value()
                .set(data2, 128);
        }
        if (mode === 1) {
            if (data1 == 32 && data2 > 0) {
                transport.play();
            }
            else if (data1 == 33 && data2 > 0) {
                transport.stop();
            }
            else if (data1 == 34 && data2 > 0) {
                transport.rewind();
            }
            else if (data1 == 35 && data2 > 0) {
                const csb = trackBank.getItemAt(trackSelected).clipLauncherSlotBank();
                csb.record(slotSelected);
                csb.launch(slotSelected);
            }
            else if (data1 == 40 && data2 > 0) {
                cursorTrack.selectPrevious();
            } else if (data1 == 41 && data2 > 0) {
                cursorTrack.selectNext();
            } else if (data1 == 45 && data2 > 0) {
                const slotBank = trackBank.getItemAt(trackSelected).clipLauncherSlotBank();
                const nextIndex = slotSelected + 1;
                if (nextIndex < slotBank.getSizeOfBank()) {
                    slotBank.select(nextIndex);
                }
            } else if (data1 == 44 && data2 > 0) {
                const slotBank = trackBank.getItemAt(trackSelected).clipLauncherSlotBank();
                const prevIndex = slotSelected - 1;
                if (prevIndex >= 0) {
                    slotBank.select(prevIndex);
                }
            } else if(data1 == 36 && data2 > 0) {
                cursorTrack.mute().toggle();

            } else if(data1 == 37 && data2 > 0) {
                cursorTrack.solo().toggle();
            } else if (data1 == 38 && data2 > 0) {
                cursorDevice.selectPrevious();
            } else if (data1 == 39 && data2 > 0) {
                cursorDevice.selectNext();
            } else if (data1 == 46 && data2 > 0) {
                app.undo();
            } else if (data1 == 47 && data2 > 0) {
                app.redo();
            } else if (data1 == 42 && data2 > 0) {
                remoteControls.selectNextPage(true);
            } else if (data1 == 43 && data2 > 0) {
                remoteControls.selectPreviousPage(true);
            }
        }
    } else {
        if (data1 == 0x00) {
            midiChannel = data2 + 1;
            println(`MIDI channel set to ${midiChannel}`);
        }
    }

}
