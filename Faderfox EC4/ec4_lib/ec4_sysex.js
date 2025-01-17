function handleSetupGroupResponse(groupedData) {
    const hexes = groupedData.split(' ');
    if (hexes.length === 14) {
        if (hexes[8] === '28' && hexes[11] === '24') {
            currentSetup = hexes[9];
            currentGroup = hexes[12];
        }
    }
}

function onSysex(data) {
    const groupedData = data.match(/.{1,2}/g).join(' ');

    handleSetupGroupResponse(groupedData);

    const setupGroup = `4e 28 ${setup} 4e 24 ${group} ${END_SYSEX.toLowerCase()}`;

    const isShiftDown = data === 'f00000004e2c1b4e26114e2e11f7';
    const isInSetupAndGroup = currentSetup === setup && currentGroup === group;

    if ((isShiftDown  && isInSetupAndGroup) ||
            groupedData.endsWith(setupGroup)) {
        if (isShiftDown) {
            mode === 0 ? mode = 1 : mode = 0;
            println(`Mode set to ${mode}`);
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
}
