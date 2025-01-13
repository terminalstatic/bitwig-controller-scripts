function handleSetupGroupResponse(groupedData) {
    const hexes = groupedData.split(' ');
    if (hexes.length === 14) {
        println(`len: ${groupedData.split(' ').length}`);
        println(`setup: ${setup}`);
        println(`group: ${group}`);
        if (hexes[8] === '28' && hexes[11] === '24') {
            currentSetup = hexes[9];
            currentGroup = hexes[12];
        }
    }
}

function onSysex(data) {
    println("Sysex received");
    println(data);
    const groupedData = data.match(/.{1,2}/g).join(' ');
    println(`GroupedData: ${groupedData}`);

    handleSetupGroupResponse(groupedData);

    const setupGroup = `4e 28 ${setup} 4e 24 ${group} ${END_SYSEX.toLowerCase()}`;
    println(`SetupGroup: ${setupGroup}`);

    //currentSetup=setupGroup[2];
    //currentGroup=setupGroup[5];

    println(`currentSetup: ${currentSetup}`);
    println(`currentGroup: ${currentGroup}`);

    const isShiftDown = data === 'f00000004e2c1b4e26114e2e11f7';
    const isInSetupAndGroup = currentSetup === setup && currentGroup === group;

    println(`Mode is ${mode}`);
    if ((isShiftDown  && isInSetupAndGroup) ||
            groupedData.endsWith(setupGroup)) {
        println("Shift down");
        if (isShiftDown) {
            mode === 0 ? mode = 1 : mode = 0;
        }

        let page;
        switch (mode) {
            case 0:
                page = dialLabels.map(row => row.join('')).join('');
                writeText(page, 0);
                break;
            case 1:
                page = BUTTON_LABELS.map(row => row.join('')).join('');
                writeText(page, 0);
                break;
        }
    }
    /*else if (data == 'f00000004e2c1b4e26114e2e10f7') {
        println(dialLabels);
        const page = dialLabels.map(row => row.join('')).join('');
        writeText(page, 0);
        println("Shift up");
    }*/
}
