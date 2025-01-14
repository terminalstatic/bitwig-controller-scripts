## Faderfox EC4

This is work in progress and most likely subject to change.
There are 2 versions, faderfox-ec4.control.js which is self contained and works together with the EC4_Bitwig.syx file/group 2 (this also contains the moss mapping in group 1). It is possible to change the midi channel the script listens to in the controller config.

The ec4-sysex.control.js also needs to have the ec4_lib directory in the scripting directory, this has almost the same mapping as the other script, except that it also utilizes the display to show the current device parameter names. 

There are 2 modes that get toggled with the shift button, mode 0 (default) shows controls device parameters on dial 1-8, vol and pan of the selected track on dial 9 and 10, 11 - 16 control the current track sends. Pressing the dials resets to the default value respectively.

Mode 1 controls track/scene/device navigation and transport on dial press. Pressing 16 starts recording into the current clip (if armed).
Turning the dials behaves the same as in mode 0.

This is currently on group 3 (if I actually have uploaded it already ;)) of the EC4_Bitwig.syx file.
It is possible to change the setup/group/midi channel in the controller config.

Might port this to java later if not too lazy.

