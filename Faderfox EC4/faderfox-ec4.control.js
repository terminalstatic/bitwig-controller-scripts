loadAPI(16);

const LOWEST_CC = 1;
const HIGHEST_CC = 119;

const DEVICE_START_CC = 16;
const DEVICE_END_CC = 23;

host.setShouldFailOnDeprecatedUse(true);

host.defineController(
  "Faderfox",
  "Faderfox EC4 Devices",
  "0.1",
  "0E5D5AE3-0649-4950-A3F4-31332A9E0DA0",
  "terminal_static"
);

host.defineMidiPorts(1, 1);

host.addDeviceNameBasedDiscoveryPair(
  ["Faderfox EC4"],
  ["Faderfox EC4"]
);

var trackSelected = 0;
var slotSelected = 0;

function init() {
  host.getMidiInPort(0).setMidiCallback(onMidi);

  transport = host.createTransport();

  app = host.createApplication();
  cursorTrack = host.createCursorTrack('x-session-cursor-track', 'Cursor Track', 6, 0, true);

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
  });

  for (let t = 0; t < trackBank.getSizeOfBank(); t++) {
    let track = trackBank.getItemAt(t);


    clipLauncherSlotBank = track.clipLauncherSlotBank();
    clipLauncherSlotBank.setIndication(true);

    for (let s = 0; s < clipLauncherSlotBank.getSizeOfBank(); s++) {
      let clipSlot = clipLauncherSlotBank.getItemAt(s);

      clipSlot.isSelected().addValueObserver(function (isSelected) {
        if (isSelected) {
          println("Clip selected in track " + t + ", slot " + s);
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


  userControls = host.createUserControls(HIGHEST_CC - LOWEST_CC + 1 - 8);

  for (let i = LOWEST_CC; i < HIGHEST_CC; i++) {
    if (!isInDeviceParametersRange(i)) {
      let index = userIndexFromCC(i);
      userControls.getControl(index).setIndication(true);
      userControls.getControl(index).setLabel("CC" + i);
    }
  }

  println("x-session initialized!");
}

function isInDeviceParametersRange(cc) {
  return cc >= DEVICE_START_CC && cc <= DEVICE_END_CC;
}

function userIndexFromCC(cc) {
  if (cc > DEVICE_END_CC) {
    return cc - LOWEST_CC - 8;
  }

  return cc - LOWEST_CC;
}

function onMidi(status, data1, data2) {
  printMidi(status, data1, data2);
  //println(MIDIChannel(status));

  if (isChannelController(status))
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
    }
    else if (data1 == 32 && data2 > 0) {
      transport.play();
    }
    else if (data1 == 33 && data2 > 0) {
      transport.stop();
    }
    else if (data1 == 34 && data2 > 0) {
      transport.rewind();
    }
    else if (data1 == 35 && data2 > 0) {
      //println(`Recording on track ${trackSelected}, slot ${slotSelected}`);
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
      if (prevIndex >= 0 ) {
        slotBank.select(prevIndex);
      }
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
    } else if (isInDeviceParametersRange(data1)) {
      let index = data1 - DEVICE_START_CC;
      remoteControls
        .getParameter(index)
        .getAmount()
        .value()
        .set(data2, 128);
    } else if (data1 >= LOWEST_CC && data1 <= HIGHEST_CC) {
      let index = data1 - LOWEST_CC + HIGHEST_CC * MIDIChannel(status);
      userControls.getControl(index).set(data2, 128);
    }
}

function flush() {
  // Flush any output to controller here.
}

function exit() { }