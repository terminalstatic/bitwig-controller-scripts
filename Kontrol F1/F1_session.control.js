loadAPI(7);

const HUE = 176;
const SATURATION = 177;
const BRIGHTNESS = 178;
const CC_CHANNEL_13 = 188;

const SCENE_START_CC = 10;
const SCENE_END_CC = 13;
const CLIP_START_CC = 14;
const CLIP_END_CC = 25;

const SCENE_START_CC_SHIFT = 51;
const SCENE_END_CC_SHIFT = 54;
const CLIP_START_CC_SHIFT = 55;
const CLIP_END_CC_SHIFT = 66;

const MUTE_AND_SOLO_START = 37;
const MUTE_AND_SOLO_END = 39;
const MUTE_AND_SOLO_MASTER = 40;

const MUTE_AND_SOLO_START_SHIFT = 74;
const MUTE_AND_SOLO_END_SHIFT = 76;
const MUTE_AND_SOLO_MASTER_SHIFT = 77;

const BROWSE_BUTTON = 32;
const BROWSE_BUTTON_SHIFT = 73;

const PUSH_ROTARY = 41;
const PUSH_ROTARY_PUSH = 42;

const PUSH_ROTARY_SHIFT = 78;
const PUSH_ROTARY_PUSH_SHIFT = 79;

const PAN_ROTARY_START = 2;
const PAN_ROTARY_END = 4;
const PAN_ROTARY_MASTER = 5;

const PAN_ROTARY_START_SHIFT = 43;
const PAN_ROTARY_END_SHIFT = 46;
//const PAN_ROTARY_MASTER_SHIFT = 46;

const VOLUME_SLIDERS_START = 6;
const VOLUME_SLIDERS_END = 8;
const VOLUME_SLIDER_MASTER = 9;

const VOLUME_SLIDERS_START_SHIFT = 47;
const VOLUME_SLIDERS_END_SHIFT = 50;
//const VOLUME_SLIDER_MASTER_SHIFT = 50;

const PLAY_BUTTON = 26;
const PLAY_RESET_BUTTON_SHIFT = 67;

const ARRANGER_RECORD_BUTTON = 27
const CLIP_RECORD_BUTTON = 68

const ARRANGER_AUTOMATION = 28
const CLIP_AUTOMATION_AND_OVERWRITE = 69

const NEXT_TRACK_BUTTON = 30;
const PREV_TRACK_BUTTON = 71;

const NEXT_SCENE_BUTTON = 29;
const PREV_SCENE_BUTTON = 70;

const UNDO_BUTTON = 31
const UNDO_BUTTON_SHIFT = 72

const SCENES_MAX_INDEX = 3;
const TRACKS_MAX_INDEX = 2;
const EFFECTS_MAX_INDEX = 3

const BRIGHT = 127
const DIM = 48
const MEDIUM = 64
const DARK = 0

const ON = 127
const OFF = 0

// Remove this if you want to be able to use deprecated methods without causing script to stop.
// This is useful during development.
host.setShouldFailOnDeprecatedUse(true);

host.defineController(
  "Native Instruments",
  "Traktor Kontrol F1 Session",
  "0.1",
  "72c70fde-f37c-4935-a7bc-9b433c42d0d3",
  "terminal_static"
);

host.defineMidiPorts(1, 1);

if (host.platformIsWindows()) {
  host.addDeviceNameBasedDiscoveryPair(
    ["Traktor Kontrol F1 - 1"],
    ["Traktor Kontrol F1 - 1"]
  );
} else if (host.platformIsMac()) {
  host.addDeviceNameBasedDiscoveryPair(
    ["Traktor Kontrol F1 - 1"],
    ["Traktor Kontrol F1 - 1"]
  );

} else if (host.platformIsLinux()) {
  host.addDeviceNameBasedDiscoveryPair(
    ["Traktor Kontrol F1 - 1"],
    ["Traktor Kontrol F1 - 1"]
  );

}

let lastScenePressed;
let lastSelectedBrowserColumn;
let clipRecordPressed = false;
let specialIsPressed = false;
let shiftSpecialIsPressed = false;

function init() {
  application = host.createApplication();
  transport = host.createTransport();

  transport.isPlaying().markInterested();
  transport.isArrangerRecordEnabled().markInterested();
  transport.isArrangerAutomationWriteEnabled().markInterested();
  transport.isClipLauncherOverdubEnabled().markInterested();
  transport.isClipLauncherAutomationWriteEnabled().markInterested();

  masterTrack = host.createMasterTrack(0);
  cursorTrack = host.createCursorTrack(4, 0);
  cursorDevice = cursorTrack.createCursorDevice();
  deviceBrowser = cursorDevice.createDeviceBrowser(1, 1);

  trackBank = host.createMainTrackBank(TRACKS_MAX_INDEX + 1, 0, SCENES_MAX_INDEX + 1);
  effectTrackBank = host.createEffectTrackBank(EFFECTS_MAX_INDEX + 1, 0)
  popupBrowser = host.createPopupBrowser();

  masterTrack.volume().markInterested();
  masterTrack.pan().markInterested();
  masterTrack.mute().markInterested();
  masterTrack.solo().markInterested();

  popupBrowser.exists().markInterested();
  popupBrowser.selectedContentTypeIndex().markInterested();


  categoryCursor = popupBrowser.categoryColumn().createCursorItem();
  categoryCursor.hitCount().markInterested();

  creatorCursor = popupBrowser.creatorColumn().createCursorItem();
  creatorCursor.hitCount().markInterested();

  deviceCursor = popupBrowser.deviceColumn().createCursorItem();
  deviceCursor.hitCount().markInterested();

  deviceTypeCursor = popupBrowser.deviceTypeColumn().createCursorItem();
  deviceTypeCursor.hitCount().markInterested();

  fileTypeCursor = popupBrowser.fileTypeColumn().createCursorItem();
  fileTypeCursor.hitCount().markInterested();

  locationCursor = popupBrowser.locationColumn().createCursorItem();
  locationCursor.hitCount().markInterested();

  resultsCursor = popupBrowser.resultsColumn().createCursorItem();

  smartCollectionCursor = popupBrowser.smartCollectionColumn().createCursorItem();
  smartCollectionCursor.hitCount().markInterested();

  tagCursor = popupBrowser.tagColumn().createCursorItem();
  tagCursor.hitCount().markInterested();

  trackBank.followCursorTrack(cursorTrack);
  trackBank.cursorIndex().markInterested();
  trackBank.sceneBank().cursorIndex().markInterested();
  trackBank.sceneBank().scrollPosition().markInterested();
  trackBank.itemCount().markInterested();
  trackBank.channelCount().markInterested();
  trackBank.channelScrollPosition().markInterested();

  for (let i = 0; i < SCENES_MAX_INDEX + 1; i++) {
    trackBank
      .sceneBank()
      .getScene(i)
      .color()
      .markInterested();
    trackBank
      .sceneBank()
      .getScene(i)
      .sceneIndex()
      .markInterested()
  }

  for (let i = 0; i < TRACKS_MAX_INDEX + 1; i++) {
    trackBank
      .getItemAt(i)
      .name()
      .markInterested();
    trackBank
      .getItemAt(i)
      .mute()
      .markInterested();
    trackBank
      .getItemAt(i)
      .solo()
      .markInterested();
    trackBank
      .getItemAt(i)
      .arm()
      .markInterested();
  }

  for (let i = 0; i < 12; i++) {
    getClipFromTrackBank(i)
      .color()
      .markInterested();
    getClipFromTrackBank(i)
      .isPlaying()
      .markInterested();
    getClipFromTrackBank(i)
      .isRecording()
      .markInterested();
    getClipFromTrackBank(i)
      .isRecordingQueued()
      .markInterested();
    getClipFromTrackBank(i)
      .hasContent()
      .markInterested();
    trackBank
      .getItemAt(parseInt(i / 4))
      .isGroup()
      .markInterested();
  }

  for (i = 0; i <= TRACKS_MAX_INDEX; i++) {
    trackBank
      .getItemAt(i)
      .clipLauncherSlotBank()
      .setIndication(true);
  }

  host.getMidiInPort(0).setMidiCallback(onMidi0);

  for (let i = SCENE_START_CC; i <= CLIP_END_CC; i++) {
    setPadColor(i, 0, 0, 0);
  }

  for (let i = SCENE_START_CC_SHIFT; i <= CLIP_END_CC_SHIFT; i++) {
    setPadColor(i, 0, 0, 0);
  }

  transport.isPlaying().markInterested();
  println("F1 session control initialized!");
}

// Called when a short MIDI message is received on MIDI input port 0.
function onMidi0(status, data1, data2) {
  if (isChannelController(status)) {
    if (data1 === PUSH_ROTARY_PUSH && !popupBrowser.exists().get()) {
      if (data2 === 127)
        specialIsPressed = true
      else
        specialIsPressed = false
    } else if (data1 === PUSH_ROTARY_PUSH_SHIFT && !popupBrowser.exists().get()) {
      if (data2 === 127)
        shiftSpecialIsPressed = true
      else
        shiftSpecialIsPressed = false
    }
    printMidi(status, data1, data2);

    if (handleTransport(status, data1, data2)) return;

    if (handleScene(status, data1, data2)) return;

    if (handleClips(status, data1, data2)) return;

    if (handleNav(status, data1, data2)) return;

    if (handleApplication(status, data1, data2)) return;

    if (handleChannels(status, data1, data2)) return;

    if (handleBrowser(status, data1, data2)) return;
  }
}

function flush() {
  sendMidi(
    CC_CHANNEL_13,
    PUSH_ROTARY_SHIFT,
    lastSelectedBrowserColumn === undefined ? 0 : lastSelectedBrowserColumn
  );

  sendMidi(
    CC_CHANNEL_13,
    PUSH_ROTARY,
    lastSelectedBrowserColumn === undefined ? 0 : lastSelectedBrowserColumn
  );

  if (transport.isPlaying().get()) {
    sendMidi(CC_CHANNEL_13, PLAY_BUTTON, ON);
  } else {
    sendMidi(CC_CHANNEL_13, PLAY_BUTTON, OFF);
  }

  if (transport.isArrangerRecordEnabled().get()) {
    sendMidi(CC_CHANNEL_13, ARRANGER_RECORD_BUTTON, ON);
  } else {
    sendMidi(CC_CHANNEL_13, ARRANGER_RECORD_BUTTON, OFF);
  }

  if (transport.isArrangerAutomationWriteEnabled().get()) {
    sendMidi(CC_CHANNEL_13, ARRANGER_AUTOMATION, ON);
  } else {
    sendMidi(CC_CHANNEL_13, ARRANGER_AUTOMATION, OFF);
  }

  if (transport.isClipLauncherOverdubEnabled().get() || transport.isClipLauncherAutomationWriteEnabled().get()) {
    sendMidi(CC_CHANNEL_13, CLIP_AUTOMATION_AND_OVERWRITE, ON);
  } else {
    sendMidi(CC_CHANNEL_13, CLIP_AUTOMATION_AND_OVERWRITE, OFF);
  }


  for (let i = 0; i < SCENES_MAX_INDEX + 1; i++) {
    let cs = rgb2hsv(
      trackBank
      .sceneBank()
      .getScene(i)
      .color()
      .red() * 255,
      trackBank
      .sceneBank()
      .getScene(i)
      .color()
      .green() * 255,
      trackBank
      .sceneBank()
      .getScene(i)
      .color()
      .blue() * 255
    );

    //let c = rgb2hsv(255, 0, 0);

    let sceneBrightness;
    if (lastScenePressed !== undefined &&
      lastScenePressed === i) {
      sceneBrightness = BRIGHT;
      lastScenePressed = undefined;
    } else {
      sceneBrightness = MEDIUM;
    }

    setPadColor(
      SCENE_START_CC + i,
      cs.h,
      cs.s,
      (cs.v = sceneBrightness)
    );
    setPadColor(
      SCENE_START_CC_SHIFT + i,
      cs.h,
      cs.s,
      (cs.v = sceneBrightness)
    );
  }

  for (let i = 0; i < 4 * (TRACKS_MAX_INDEX + 1); i++) {
    let isPlaying =
      getClipFromTrackBank(i)
      .isPlaying()
      .get();
    let brightness = isPlaying ? BRIGHT : DIM;

    if (getClipFromTrackBank(i)
      .hasContent().get()) {

      if (getClipFromTrackBank(i)
        .isRecording()
        .get() || getClipFromTrackBank(i)
        .isRecordingQueued()
        .get()) {
        setPadColor(
          CLIP_START_CC + i,
          0,
          127,
          brightness
        );
        setPadColor(
          CLIP_START_CC_SHIFT + i,
          0,
          127,
          brightness
        );
      } else {

        let cclip = rgb2hsv(
          getClipFromTrackBank(i)
          .color()
          .red() * 255,
          getClipFromTrackBank(i)
          .color()
          .green() * 255,
          getClipFromTrackBank(i)
          .color()
          .blue() * 255
        );

        //setPadColor(CLIP_START_CC + i, cclip.h * 127, cclip.s * 127, cclip.v * 127);
        setPadColor(
          CLIP_START_CC + i,
          cclip.h,
          cclip.s,
          cclip.v !== 0 ? brightness : 0
        );
        setPadColor(
          CLIP_START_CC_SHIFT + i,
          cclip.h,
          cclip.s,
          cclip.v !== 0 ? brightness : 0
        );
      }
    } else {
      setPadColor(
        CLIP_START_CC + i,
        0,
        0,
        0
      );
      setPadColor(
        CLIP_START_CC_SHIFT + i,
        0,
        0,
        0
      );
    }
  }

  if (popupBrowser.exists().get()) {
    sendMidi(CC_CHANNEL_13, BROWSE_BUTTON, ON);
  } else {
    sendMidi(CC_CHANNEL_13, BROWSE_BUTTON, OFF);
  }

  for (let i = MUTE_AND_SOLO_START_SHIFT; i <= MUTE_AND_SOLO_END_SHIFT; i++) {
    if (
      trackBank
      .getItemAt(TRACKS_MAX_INDEX - (MUTE_AND_SOLO_END_SHIFT - i))
      .solo()
      .get()
    ) {
      sendMidi(CC_CHANNEL_13, i, BRIGHT);
    } else {
      sendMidi(CC_CHANNEL_13, i, DARK);
    }
  }

  for (let i = MUTE_AND_SOLO_START; i <= MUTE_AND_SOLO_END; i++) {
    if (
      trackBank
      .getItemAt(TRACKS_MAX_INDEX - (MUTE_AND_SOLO_END - i))
      .mute()
      .get()
    ) {
      sendMidi(CC_CHANNEL_13, i, ON);
    } else {
      sendMidi(CC_CHANNEL_13, i, OFF);
    }
  }

  if (masterTrack.mute().get()) {
    sendMidi(CC_CHANNEL_13, MUTE_AND_SOLO_MASTER, ON);
  } else {
    sendMidi(CC_CHANNEL_13, MUTE_AND_SOLO_MASTER, OFF);
  }
  if (masterTrack.solo().get()) {
    sendMidi(CC_CHANNEL_13, MUTE_AND_SOLO_MASTER_SHIFT, ON);
  } else {
    sendMidi(CC_CHANNEL_13, MUTE_AND_SOLO_MASTER_SHIFT, OFF);
  }
}

function exit() {
  for (let i = SCENE_START_CC; i <= CLIP_END_CC; i++) {
    setPadColor(i, 0, 0, 0);
  }

  for (let i = SCENE_START_CC_SHIFT; i <= CLIP_END_CC_SHIFT; i++) {
    setPadColor(i, 0, 0, 0);
  }
}

function handleTransport(status, data1, data2) {
  if (data1 === PLAY_BUTTON) {
    transport.play();
    return true;
  } else if (data1 === PLAY_RESET_BUTTON_SHIFT && data2 > 0) {
    transport.setPosition(0);
    return true;
  } else if (data1 === ARRANGER_RECORD_BUTTON && data2 > 0) {
    transport.record()
    return true;
  } else if (data1 === ARRANGER_AUTOMATION && data2 > 0) {
    transport.toggleWriteArrangerAutomation()
    return true;
  } else if (data1 === CLIP_AUTOMATION_AND_OVERWRITE && data2 > 0) {
    transport.toggleWriteClipLauncherAutomation()
    transport.isClipLauncherOverdubEnabled().toggle();
    return true;
  }
  return false;
}

function handleScene(status, data1, data2) {
  if (data1 >= SCENE_START_CC && data1 <= SCENE_END_CC && data2 > 0) {
    //For future reference
    //firstSceneOfBank = trackBank.sceneBank().getScene(0).sceneIndex().get()
    //sceneIndex = trackBank.sceneBank().getScene(data1 - SCENE_START_CC).sceneIndex().get()
    trackBank.sceneBank().launchScene(data1 - SCENE_START_CC);
    lastScenePressed = data1 - SCENE_START_CC;
    return true;
  } else if (
    data1 >= SCENE_START_CC_SHIFT &&
    data1 <= SCENE_END_CC_SHIFT &&
    data2 > 0
  ) {
    trackBank.sceneBank().launchScene(data1 - SCENE_START_CC_SHIFT);
    lastScenePressed = data1 - SCENE_START_CC_SHIFT;
    return true;
  }
  return false;
}

function handleClips(status, data1, data2) {
  if (data1 >= CLIP_START_CC && data1 <= CLIP_END_CC && data2 > 0) {
    let pnum = data1 - CLIP_START_CC;
    if (specialIsPressed) {
      trackBank
        .getItemAt(parseInt(pnum / 4))
        .clipLauncherSlotBank()
        .duplicateClip(pnum % 4);
    } else if (shiftSpecialIsPressed) {
      trackBank
        .getItemAt(parseInt(pnum / 4))
        .clipLauncherSlotBank()
        .deleteClip(pnum % 4);
    } else if (clipRecordPressed) {
      if (getClipFromTrackBank(pnum)
        .isRecording()
        .get() || getClipFromTrackBank(pnum)
        .isRecordingQueued()
        .get()) {
        trackBank
          .getItemAt(parseInt(pnum / 4))
          .stop();
      } else {
        if (transport.isPlaying().get()) {
          trackBank
            .getItemAt(parseInt(pnum / 4))
            .clipLauncherSlotBank()
            .record(pnum % 4);
        }
      }
    } else if (!getClipFromTrackBank(pnum)
      .isPlaying()
      .get())
      getClipFromTrackBank(pnum)
      .launch();
    else
      trackBank
      .getItemAt(parseInt(pnum / 4))
      .stop();
    if (
      trackBank
      .getItemAt(parseInt(pnum / 4))
      .isGroup()
      .get()
    ) {
      lastScenePressed = pnum % 4;
    }
    return true;
  } else if (data1 >= CLIP_START_CC_SHIFT && data1 <= CLIP_END_CC_SHIFT && data2 > 0) {
    let pnum = data1 - CLIP_START_CC_SHIFT;
    if (specialIsPressed) {
      trackBank
        .getItemAt(parseInt(pnum / 4))
        .clipLauncherSlotBank()
        .duplicateClip(pnum % 4);
    } else if (shiftSpecialIsPressed) {
      trackBank
        .getItemAt(parseInt(pnum / 4))
        .clipLauncherSlotBank()
        .deleteClip(pnum % 4);
    } else if (clipRecordPressed) {
      if (getClipFromTrackBank(pnum)
        .isRecording()
        .get() || getClipFromTrackBank(pnum)
        .isRecordingQueued()
        .get()) {
        trackBank
          .getItemAt(parseInt(pnum / 4))
          .stop();
      } else {
        if (transport.isPlaying().get()) {
          trackBank
            .getItemAt(parseInt(pnum / 4))
            .clipLauncherSlotBank()
            .record(pnum % 4);
        }
      }
    } else if (!getClipFromTrackBank(pnum)
      .isPlaying()
      .get())
      getClipFromTrackBank(pnum)
      .launch();
    else
      trackBank
      .getItemAt(parseInt(pnum / 4))
      .stop();
    if (
      trackBank
      .getItemAt(parseInt(pnum / 4))
      .isGroup()
      .get()
    ) {
      lastScenePressed = pnum % 4;
    }
    return true;
  } else if (data1 === CLIP_RECORD_BUTTON) {
    if (data2 > 0) {
      clipRecordPressed = true
      sendMidi(CC_CHANNEL_13, data1, ON)
    } else {
      clipRecordPressed = false
      sendMidi(CC_CHANNEL_13, data1, OFF)
    }
    return true;
  }
  return false;
}

function handleNav(status, data1, data2) {
  if (data1 === NEXT_TRACK_BUTTON && data2 > 0 && !specialIsPressed) {
    cursorTrack.selectNext();
    trackBank.scrollForwards();
    return true;
  } else if (data1 === NEXT_TRACK_BUTTON && data2 > 0 && specialIsPressed) {
    effectTrackBank.scrollForwards();
    return true;
  } else if (data1 === PREV_TRACK_BUTTON && data2 > 0 && shiftSpecialIsPressed) {
    effectTrackBank.scrollBackwards();
    return true;
  } else if (data1 === PREV_TRACK_BUTTON && data2 > 0 && !shiftSpecialIsPressed) {
    cursorTrack.selectPrevious();
    trackBank.scrollBackwards();
    return true;
  } else if (data1 === NEXT_SCENE_BUTTON && data2 > 0) {
    trackBank.scrollScenesDown();
    return true;
  } else if (data1 === PREV_SCENE_BUTTON && data2 > 0) {
    trackBank.scrollScenesUp();
    return true;
  }
  return false;
}

function handleApplication(status, data1, data2) {
  if (data1 === UNDO_BUTTON && data2 > 0) {
    application.undo();
    return true;
  } else if (data1 === UNDO_BUTTON_SHIFT && data2 > 0) {
    application.redo();
    return true;
  }
  return false;
}

function handleChannels(status, data1, data2) {
  if (data1 === VOLUME_SLIDER_MASTER) {
    masterTrack.volume().set(data2, 128);
    return true;
  } else if (data1 === PAN_ROTARY_MASTER && !specialIsPressed) {
    masterTrack.pan().set(data2, 128);
    return true;
  } else if (data1 >= VOLUME_SLIDERS_START && data1 <= VOLUME_SLIDERS_END) {
    trackBank
      .getItemAt(TRACKS_MAX_INDEX - (VOLUME_SLIDERS_END - data1))
      .volume()
      .set(data2, 128);
    return true;
  } else if (data1 >= VOLUME_SLIDERS_START_SHIFT && data1 <= VOLUME_SLIDERS_END_SHIFT) {
    effectTrackBank
      .getItemAt(EFFECTS_MAX_INDEX - (VOLUME_SLIDERS_END_SHIFT - data1))
      .volume()
      .set(data2, 128);
    return true;
  } else if (data1 >= PAN_ROTARY_START && data1 <= PAN_ROTARY_END && !specialIsPressed) {
    trackBank
      .getItemAt(TRACKS_MAX_INDEX - (PAN_ROTARY_END - data1))
      .pan()
      .set(data2, 128);
    return true;
  } else if (data1 >= PAN_ROTARY_START_SHIFT && data1 <= PAN_ROTARY_END_SHIFT && !shiftSpecialIsPressed) {
    effectTrackBank
      .getItemAt(EFFECTS_MAX_INDEX - (PAN_ROTARY_END_SHIFT - data1))
      .pan()
      .set(data2, 128);
    return true;
  } else if (data1 >= PAN_ROTARY_START && data1 <= PAN_ROTARY_END + 1 && specialIsPressed) {
    cursorTrack.sendBank().getItemAt(3 - (PAN_ROTARY_END + 1 - data1)).set(data2, 128);
    return true;
  } else if (data1 >= MUTE_AND_SOLO_START && data1 <= MUTE_AND_SOLO_END && specialIsPressed) {
    trackBank.getItemAt(TRACKS_MAX_INDEX - (MUTE_AND_SOLO_END - data1)).select()
    return true;
  } else if (data1 >= MUTE_AND_SOLO_START_SHIFT && data1 <= MUTE_AND_SOLO_END_SHIFT && shiftSpecialIsPressed) {
    if (trackBank.getItemAt(TRACKS_MAX_INDEX - (MUTE_AND_SOLO_END_SHIFT - data1)).arm().get())
      trackBank.getItemAt(TRACKS_MAX_INDEX - (MUTE_AND_SOLO_END_SHIFT - data1)).arm().set(false)
    else
      trackBank.getItemAt(TRACKS_MAX_INDEX - (MUTE_AND_SOLO_END_SHIFT - data1)).arm().set(true)
    return true;
  } else if (data1 >= MUTE_AND_SOLO_START && data1 <= MUTE_AND_SOLO_END && !specialIsPressed) {
    if (
      trackBank
      .getItemAt(TRACKS_MAX_INDEX - (MUTE_AND_SOLO_END - data1))
      .mute()
      .get()
    ) {
      trackBank
        .getItemAt(TRACKS_MAX_INDEX - (MUTE_AND_SOLO_END - data1))
        .mute()
        .set(false);
    } else {
      trackBank
        .getItemAt(TRACKS_MAX_INDEX - (MUTE_AND_SOLO_END - data1))
        .mute()
        .set(true);
    }
    return true;
  } else if (data1 === MUTE_AND_SOLO_MASTER && !specialIsPressed) {
    if (masterTrack.mute().get()) {
      masterTrack.mute().set(false);
    } else {
      masterTrack.mute().set(true);
    }
    return true;
  } else if (data1 === MUTE_AND_SOLO_MASTER_SHIFT && !specialIsPressed) {
    if (masterTrack.solo().get()) {
      masterTrack.solo().set(false);
    } else {
      masterTrack.solo().set(true);
    }
    return true;
  } else if (
    data1 >= MUTE_AND_SOLO_START_SHIFT && data1 <= MUTE_AND_SOLO_END_SHIFT && !specialIsPressed) {
    if (
      trackBank
      .getItemAt(TRACKS_MAX_INDEX - (MUTE_AND_SOLO_END_SHIFT - data1))
      .solo()
      .get()
    ) {
      trackBank
        .getItemAt(TRACKS_MAX_INDEX - (MUTE_AND_SOLO_END_SHIFT - data1))
        .solo()
        .set(false);
    } else {
      trackBank
        .getItemAt(TRACKS_MAX_INDEX - (MUTE_AND_SOLO_END_SHIFT - data1))
        .solo()
        .set(true);
    }
    return true;
  }
  return false;
}

function handleBrowser(status, data1, data2) {
  if (data1 === BROWSE_BUTTON && specialIsPressed && !popupBrowser.exists().get()) {
    cursorDevice.afterDeviceInsertionPoint().browse()
    //deviceBrowser.startBrowsing();
    //deviceBrowser.activateSession(deviceBrowser.getDeviceSession());
    return true;
  } else if (data1 === BROWSE_BUTTON && !specialIsPressed && !popupBrowser.exists().get()) {
    //deviceBrowser.startBrowsing();
    //deviceBrowser.activateSession(deviceBrowser.getDeviceSession());
    cursorDevice.createDeviceBrowser(1, 1).startBrowsing()
    return true;
  } else if (data1 === BROWSE_BUTTON && popupBrowser.exists().get()) {
    popupBrowser.cancel();
    return true;
  } else if (data1 === PUSH_ROTARY && popupBrowser.exists().get()) {
    if (data2 === 1) {
      if (!lastSelectedBrowserColumn || lastSelectedBrowserColumn === 0 || lastSelectedBrowserColumn > 9) {
        //popupBrowser.selectNextFile();
        resultsCursor.selectNext();
        lastSelectedBrowserColumn = 0;
      } else if (lastSelectedBrowserColumn === 1)
        smartCollectionCursor.selectNext();
      else if (lastSelectedBrowserColumn === 2)
        locationCursor.selectNext();
      else if (lastSelectedBrowserColumn === 3)
        deviceCursor.selectNext();
      else if (lastSelectedBrowserColumn === 4)
        categoryCursor.selectNext();
      else if (lastSelectedBrowserColumn === 5)
        tagCursor.selectNext();
      else if (lastSelectedBrowserColumn === 6)
        creatorCursor.selectNext();
      else if (lastSelectedBrowserColumn === 7)
        deviceTypeCursor.selectNext();
      else if (lastSelectedBrowserColumn === 8)
        fileTypeCursor.selectNext();
      else if (lastSelectedBrowserColumn === 9) {
        popupBrowser
          .selectedContentTypeIndex()
          .set(
            popupBrowser.selectedContentTypeIndex().get() < 4 ?
            popupBrowser.selectedContentTypeIndex().get() + 1 : 0
          );
      }
    } else {
      if (!lastSelectedBrowserColumn || lastSelectedBrowserColumn === 0 || lastSelectedBrowserColumn > 9) {
        //popupBrowser.selectPreviousFile();
        resultsCursor.selectPrevious();
        lastSelectedBrowserColumn = 0;
      } else if (lastSelectedBrowserColumn === 1)
        smartCollectionCursor.selectPrevious();
      else if (lastSelectedBrowserColumn === 2)
        locationCursor.selectPrevious();
      else if (lastSelectedBrowserColumn === 3)
        deviceCursor.selectPrevious();
      else if (lastSelectedBrowserColumn === 4)
        categoryCursor.selectPrevious();
      else if (lastSelectedBrowserColumn === 5)
        tagCursor.selectPrevious();
      else if (lastSelectedBrowserColumn === 6)
        creatorCursor.selectPrevious();
      else if (lastSelectedBrowserColumn === 7)
        deviceTypeCursor.selectPrevious();
      else if (lastSelectedBrowserColumn === 8)
        fileTypeCursor.selectPrevious();
      else if (lastSelectedBrowserColumn === 9) {
        popupBrowser
          .selectedContentTypeIndex()
          .set(
            popupBrowser.selectedContentTypeIndex().get() > 0 ?
            popupBrowser.selectedContentTypeIndex().get() - 1 : 4
          );
      }
    }
    return true;
  } else if (data1 === PUSH_ROTARY_SHIFT && popupBrowser.exists().get()) {
    if (data2 === 1) {
      if (lastSelectedBrowserColumn === undefined)
        lastSelectedBrowserColumn = 1
      else
        lastSelectedBrowserColumn = chooseBrowserCursor(lastSelectedBrowserColumn, true)
    } else {
      lastSelectedBrowserColumn = chooseBrowserCursor(lastSelectedBrowserColumn, false)
    }
    sendMidi(
      CC_CHANNEL_13,
      PUSH_ROTARY_SHIFT,
      lastSelectedBrowserColumn === undefined ? 0 : lastSelectedBrowserColumn
    );

    sendMidi(
      CC_CHANNEL_13,
      PUSH_ROTARY,
      lastSelectedBrowserColumn === undefined ? 0 : lastSelectedBrowserColumn
    );
    return true;
  } else if (data1 === PUSH_ROTARY_PUSH && data2 > 0 && popupBrowser.exists().get()) {
    popupBrowser.commit();
    return true;
  } else if (data1 === PUSH_ROTARY_PUSH_SHIFT && popupBrowser.exists().get()) {
    popupBrowser.cancel();
    return true;
  }
  return false;
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

function getClipFromTrackBank(t) {
  return trackBank
    .getItemAt(parseInt(t / 4))
    .clipLauncherSlotBank()
    .getItemAt(t % 4)
}

function chooseBrowserCursor(index, forwards) {

  if (forwards) {
    switch (index + 1) {
      case 1:
        if (smartCollectionCursor.hitCount().get() === 0) {
          return chooseBrowserCursor(index + 1, true)
        }
        break;
      case 2:
        if (locationCursor.hitCount().get() === 0) {
          return chooseBrowserCursor(index + 1, true)
        }
        break;
      case 3:
        if (deviceCursor.hitCount().get() === 0) {
          return chooseBrowserCursor(index + 1, true)
        }
        break;
      case 4:
        if (categoryCursor.hitCount().get() === 0) {
          return chooseBrowserCursor(index + 1, true)
        }
        break;
      case 5:
        if (tagCursor.hitCount().get() === 0) {
          return chooseBrowserCursor(index + 1, true)
        }
        break;
      case 6:
        if (creatorCursor.hitCount().get() === 0) {
          return chooseBrowserCursor(index + 1, true)
        }
        break;
      case 7:
        if (deviceTypeCursor.hitCount().get() === 0) {
          return chooseBrowserCursor(index + 1, true)
        }
        break;
      case 8:
        if (fileTypeCursor.hitCount().get() === 0) {
          return chooseBrowserCursor(index + 1, true)
        }
        break;
    }
    return (index < 9 ? index + 1 : 0)
  } else {
    switch (index - 1) {
      case 1:
        if (smartCollectionCursor.hitCount().get() === 0) {
          return chooseBrowserCursor(index - 1, false)
        }
        break;
      case 2:
        if (locationCursor.hitCount().get() === 0) {
          return chooseBrowserCursor(index - 1, false)
        }
        break;
      case 3:
        if (deviceCursor.hitCount().get() === 0) {
          return chooseBrowserCursor(index - 1, false)
        }
        break;
      case 4:
        if (categoryCursor.hitCount().get() === 0) {
          return chooseBrowserCursor(index - 1, false)
        }
        break;
      case 5:
        if (tagCursor.hitCount().get() === 0) {
          return chooseBrowserCursor(index - 1, false)
        }
        break;
      case 6:
        if (creatorCursor.hitCount().get() === 0) {
          return chooseBrowserCursor(index - 1, false)
        }
        break;
      case 7:
        if (deviceTypeCursor.hitCount().get() === 0) {
          return chooseBrowserCursor(index - 1, false)
        }
        break;
      case 8:
        if (fileTypeCursor.hitCount().get() === 0) {
          return chooseBrowserCursor(index - 1, false)
        }
        break;
    }
    return (index > 0 ? index - 1 : 9)
  }
}