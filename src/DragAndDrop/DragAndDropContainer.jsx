const DragAndDropContainer = ({ name, children, listeners, attributes, setNodeRef }) => {
    // listeners={listeners} attributes={attributes} ref={setNodeRef}
    return (
        <div ref={setNodeRef} className={'insetdiv'} style={{ padding: '10px', margin: '0px 0px 5px 0px' }}>
            <div {...listeners} {...attributes} style={{ cursor: 'grab', padding: '5px' }}>
                <strong>{name}</strong>
            </div>
            <div style={{ overflow: 'auto' }} >{children}</div>
        </div>
    );
};

export default DragAndDropContainer;