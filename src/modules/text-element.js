class TextElement extends fabric.IText{
    constructor(position = { top: 0, left: 0 }, text = 'New Text', styles = { bold: false, italic: false, underline: false }) {
        const style = {
            left: position.left,
            top: position.top,
            fontSize: 20,
            fill: '#000000',
            editable: true,
            underline: styles.underline,
            fontFamily: 'Lato',
            fontWeight: (styles.bold ? 'bold' : 'normal'),
            fontStyle: (styles.italic ? 'italic' : 'normal')
        };
        super(text, style); 
    }

    setTextStyle(style) {
        var styleObj = {
            fontWeight: 'normal',
            fontStyle: 'normal',
            fill: '#000',
            backgroundColor: 'transparent'
        }
        switch (style) {
            case 'bold':
                styleObj.fontWeight = 'bold'
                break;
            case 'italic':
                styleObj.fontStyle = 'italic'
                break;
            case 'red':
                styleObj.fill = '#F00'
                break;
            case 'green':
                styleObj.fill = '#008000'
                break;
            case 'lgray':
                styleObj.fill = '#d3d3d3'
                break;
            case 'bgcyan':
                styleObj.backgroundColor = '#0FF'
                break;
            case 'bgyellow':
                styleObj.backgroundColor = '#FF0'
                break;
            default:
                break;
        }
        Object.assign(this, styleObj);
    }
}