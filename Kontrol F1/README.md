## Traktor Kontrol F1

Basically just me playing around a little with the F1 and the bitwig api, having fun blinking some lights ...

### Bitwig Scene Control

#### Installation
Download and copy F1_scene.control.js into bitwigs controller scripts dir (preferrably into a subdir), download and open/select Bitwig_scene.nckf1 template in native instruments controller scripts editor and don't close it, in bitwig choose settings -> controllers -> controller -> add -> Native Instruments -> Traktor Kontrol F1 Scene.

For the ports choose port 1 for in and out (script currently only works with one F1 device).

#### Buttons
---
**sync** toggle play

**shift + sync** Pressed while playing stops, pressed when stopped resets track position to 1.1.1.00

**quant** Toggles arranger & arranger automation record

**capture** toggle arranger automation

**shift + capture** toggle clip overdub and automation overdub

**push rotary push encoder + capture** save current project

**reverse** and **shift + reverse** move scene cursor forward/backwards

**type** and **shift + type** move track cursor forward/backwards

**push rotary push encoder + type** and **shift + push rotary push encoder + type** move effect bank cursor forwards/backwards

**size** and **shift + size** undo/redo

**browse** open device browser on active device

**push rotary push encoder + browse** open browser for insert after current device

#### Browser
---
**rotary push encoder** move next/prev in column

**shift + rotary push encoder** move next/prev column

**push rotary push encoder** select item and exit browser

**browse** exit browser without selecting an item

#### Pads
---
**top row pads** and **shift + top row pads** launch scene

**row 2-4** and **shift + row 2-4** launch/stop clips

**shift + quant + clip pad** if playing toggles clip recording 

**shift + push rotary push encoder + quant + clip pad** duplicate clip content

**push rotary push encoder + pad** duplicate clip

**shift + rotary push encoder** set empty clip length, default 1

**shift + push rotary push encoder + pad** delete clip if clip exists, create empty clip with selected length if clip doesn't exist

**small pads 1-3** mute tracks

**small pad 4** mute master

**shift + small pads 1-3** solo tracks

**shift + small pad 4** solo master

**push rotary push encoder + small pads 1-3** select track

**push rotary push encoder + small pad 4** select master

**shift + push rotary push encoder + small pads 1-4** select effect track

**shift + quant + small pads 1-3** toggle arm track

**shift + quant + small pad 4** toggle arm master (???)

**shift + push rotary push encoder + quant + small pads 1-4** toggle arm effect track (???)

#### Rotary encoders and faders
---
**rotary encoders 1-3** track pan

**shift + rotary encoders 1-4** effect pan

**rotary encoder 4** master pan

**faders 1-3** track volume

**shift + faders 1-4** effect volume

**fader 4** master volume

**push rotary push encoder + rotary encoder 1 - 4** control current track sends 1 - 4

**push rotary push encoder + fader 1 - 4** control current track sends 5 - 8
