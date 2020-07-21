loadAPI(7);

const LOWEST_CC = 1;
const HIGHEST_CC = 119;

const DEVICE_START_CC = 24;
const DEVICE_END_CC = 31;

// Remove this if you want to be able to use deprecated methods without causing script to stop.
// This is useful during development.
host.setShouldFailOnDeprecatedUse(true);

host.defineController(
  "M-Audio",
  "X-Session UC-17",
  "0.1",
  "c128c3b9-6aa7-4adb-831e-725aefdf92a0",
  "terminal_static"
);

host.defineMidiPorts(1, 1);

host.addDeviceNameBasedDiscoveryPair(
  ["EV-XS USB MIDI Controlle In [1]"],
  ["EV-XS USB MIDI Controll Out [1]"]
);

function init() {
  host.getMidiInPort(0).setMidiCallback(onMidi);

  transport = host.createTransport();

  app = host.createApplication();
  cursorTrack = host.createCursorTrack(3, 0);
  cursorDevice = cursorTrack.createCursorDevice();
  remoteControls = cursorDevice.createCursorRemoteControlsPage(8);

  for (let i = 0; i < 8; i++) {
    let p = remoteControls.getParameter(i).getAmount();
    p.setIndication(true);
    p.setLabel("P" + (i + 1));
  }

  // Make the rest freely mappable
  userControls = host.createUserControls(HIGHEST_CC - LOWEST_CC + 1 - 8);

  for (let i = LOWEST_CC; i < HIGHEST_CC; i++) {
    if (!isInDeviceParametersRange(i)) {
      println(i + " " + isInDeviceParametersRange(i));
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
  //printMidi(status, data1, data2);
  //println(MIDIChannel(status));

  if (isChannelController(status))
    if (data1 == 10 && data2 > 0) {
      cursorTrack.volume().set(data2, 128);
    } else if (data1 == 32 && data2 > 0) {
      transport.play();
    } else if (data1 == 33 && data2 > 0) {
      transport.isClipLauncherAutomationWriteEnabled().toggle();
    } else if (data1 == 34 && data2 > 0) {
      transport.isClipLauncherOverdubEnabled().toggle();
    } else if (data1 == 35 && data2 > 0) {
      cursorTrack.selectPrevious();
    } else if (data1 == 36 && data2 > 0) {
      cursorTrack.selectNext();
    } else if (data1 == 37 && data2 > 0) {
      app.undo();
    } else if (data1 == 38 && data2 > 0) {
      cursorDevice.selectPrevious();
    } else if (data1 == 39 && data2 > 0) {
      cursorDevice.selectNext();
    } else if (data1 == 40 && data2 > 0) {
      app.redo();
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
      println(data1);
      let index = data1 - LOWEST_CC + HIGHEST_CC * MIDIChannel(status);
      userControls.getControl(index).set(data2, 128);
    }
}

function flush() {
  // TODO: Flush any output to your controller here.
}

function exit() {}
