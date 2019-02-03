# bitwig-controller-scripts

## QuNexus 
QuNexus scripts are just generic midi keyboard scripts, multi version has all channels mapped.
Nothing special here, any generic keyboard script does the job. I just keep this for convenience.

## Traktor Kontrol F1
**!!This is still work in progress!!**

Basically just me playing around a little with the F1 and the bitwig api, having fun blinking some lights ...

### Bitwig Scene Control

#### Installation
Copy Kontrol F1 dir into bitwigs controller scripts dir, open and select Bitwig_scene.nckf1 template in native instruments controller scripts editor, in bitwig choose settings -> controllers -> controller -> add -> Native Instruments -> Traktor Kontrol F1 Scene.

For the ports choose port 1 for in and out (script currently only works with one F1 device).

#### Buttons
**sync** toggle play

**shift + sync** Pressed while playing stops, pressed when stopped resets track position to 1.1.1.00

**quant** Toggles arranger & arranger automation record

**shift + quant + clip pad** if playing toggles clip recording 

**capture** toggle arranger automation

**shift + capture** toggle clip overdub and automation overdub

**reverse** and **shift + reverse** move scene cursor forward/backwards

**type** and **shift + type** move track cursor forward/backwards

**size** and **shift + size** undo/redo

**browse** open device browser on active device/select new

**push rotary push encoder + type** and **shift + push rotary push encoder + type** move effect bank cursor forwards/backwards

#### Browser

**rotary push encoder** move next/prev in column

**rotary push encoder + shift** move next/prev column

**push rotary push encoder** select column item and exit browser

**browse** exit browser without selecting an item

#### Pads

**top row pads** and **top row pads + shift** launch scene

**row 2-4** and **row 2-4 + shift** launch/stop clips

**push rotary push encoder + pad** duplicate clip

**shift + push rotary push encoder + pad** delete clip

**small pads 1-3** mute tracks

**small pad 4** mute master

**small pads 1-3 + shift** solo tracks

**small pad 4 + shift** solo master

**push rotary push encoder + small pads 1-3** select track

**shift + push rotary push encoder + small pads 1-3** toggle record for track

#### Rotary encoders and faders

**rotary encoders 1-3** track pan

**rotary encoders 1-4 + shift** effect pan

**rotary encoder 4** master pan

**faders 1-3** track volume

**faders 1-4 + shift** effect volume

**fader 4** master volume

**push rotary push encoder + rotary encoder 1 - 4** control current track sends 1 - 4




