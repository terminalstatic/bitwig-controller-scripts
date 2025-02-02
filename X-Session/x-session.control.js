loadAPI(16);

const LOWEST_CC = 1;
const HIGHEST_CC = 119;

const DEVICE_START_CC = 24;
const DEVICE_END_CC = 31;

host.setShouldFailOnDeprecatedUse(true);

host.defineController(
  "M-Audio",
  "X-Session UC-17",
  "0.2",
  "c128c3b9-6aa7-4adb-831e-725aefdf92a0",
  "terminal_static"
);

host.defineMidiPorts(1, 1);

if (host.platformIsWindows()) {
  host.addDeviceNameBasedDiscoveryPair(
    ["EV-XS USB MIDI Controlle In [1]"],
    ["EV-XS USB MIDI Controll Out [1]"]);
} else {
  host.addDeviceNameBasedDiscoveryPair(
    ["EV-XS USB MIDI Controller Port 1"],
    ["EV-XS USB MIDI Controller Port 1"]
  );
}

var trackSelected = 0;
var slotSelected = 0;

function init() {
  host.getMidiInPort(0).setMidiCallback(onMidi);

  transport = host.createTransport();

  app = host.createApplication();
  cursorTrack = host.createCursorTrack('x-session-cursor-track', 'Cursor Track', 0, 0, true);

  trackBank = host.createTrackBank(8, 0, 128);
  trackBank.followCursorTrack(cursorTrack);

  trackBank.cursorIndex().markInterested();
  trackBank.itemCount().markInterested();
  trackBank.channelCount().markInterested();
  trackBank.channelScrollPosition().markInterested();

  /*trackBank.channelCount().addValueObserver((count) => {
    println(`Track count: ${count}`);
  });

  trackBank.channelScrollPosition().addValueObserver((position) => {
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
          //println("Clip selected in track " + t + ", slot " + s);
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

  // Freely mappable
  userControls = host.createUserControls(HIGHEST_CC - LOWEST_CC + 1 - 8);

  for (let i = LOWEST_CC; i < HIGHEST_CC; i++) {
    if (!isInDeviceParametersRange(i)) {
      let index = userControlIndexFromCC(i);
      userControls.getControl(index).setIndication(true);
      userControls.getControl(index).setLabel("CC" + i);
    }
  }

  println("x-session initialized!");
}

function isInDeviceParametersRange(cc) {
  return cc >= DEVICE_START_CC && cc <= DEVICE_END_CC;
}

function userControlIndexFromCC(cc) {
  if (cc > DEVICE_END_CC) {
    return cc - LOWEST_CC - 8;
  }
  return cc - LOWEST_CC;
}

function onMidi(status, data1, data2) {
  //printMidi(status, data1, data2);
  //println(MIDIChannel(status));

  if (isChannelController(status))
    if (data1 == 10 && data2 > 0) {
      cursorTrack.volume().set(data2, 128);
    } else if (data1 == 32 && data2 > 0) {
      transport.play();
    }
    else if (data1 == 33 && data2 > 0) {
      transport.stop();
      transport.rewind();
    }
    // Maybe add this later
    /*else if (data1 == 34 && data2 > 0) {
      transport.isClipLauncherOverdubEnabled().toggle();
    }*/
    /*else if (data1 == 33 && data2 > 0) {
      println("toggle automation write");
      transport.isClipLauncherAutomationWriteEnabled().toggle();
    }*/
    else if (data1 == 34 && data2 > 0) {
      //println(`Recording on track ${trackSelected}, slot ${slotSelected}`);
      const csb = trackBank.getItemAt(trackSelected).clipLauncherSlotBank();
      csb.record(slotSelected);
      csb.launch(slotSelected);
    }
    else if (data1 == 35 && data2 > 0) {
      cursorTrack.selectPrevious();
    } else if (data1 == 37 && data2 > 0) {
      cursorTrack.selectNext();
    } else if (data1 == 36 && data2 > 0) {
      app.undo();
    } else if (data1 == 38 && data2 > 0) {
      cursorDevice.selectPrevious();
    } else if (data1 == 39 && data2 > 0) {
      app.redo();
    } else if (data1 == 40 && data2 > 0) {
      cursorDevice.selectNext();
    } else if (data1 == 41 && data2 > 0) {
      remoteControls.selectNextPage(true);
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
  // TODO: Flush any output to your controller here.
}

function exit() { }