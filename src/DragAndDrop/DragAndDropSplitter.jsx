import React, { useState } from 'react';
import { DndContext, DragOverlay, useDroppable, useDraggable, closestCenter, rectIntersection } from '@dnd-kit/core';
import DragAndDropContainer from './DragAndDropContainer.jsx';
import { CSS } from '@dnd-kit/utilities';
import SplitPane from '../SplitPane/SplitPane.jsx';
function MClosestCenter(_ref) {
    function sortCollisionsAsc(_ref, _ref2) {
        let {
            data: {
                value: a
            }
        } = _ref;
        let {
            data: {
                value: b
            }
        } = _ref2;
        return a - b;
    }

    function centerOfRectangle(rect, left, top) {
        if (left === void 0) {
            left = rect.left;
        }
        if (top === void 0) {
            top = rect.top;
        }
        return {
            x: left + rect.width * 0.5,
            y: top// + rect.height * 0.5
        };
    }
    function distanceBetween(p1, p2) {
        return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
    }

    let {
        collisionRect,
        droppableRects,
        droppableContainers
    } = _ref;
    const centerRect = centerOfRectangle(collisionRect, collisionRect.left, collisionRect.top);
    const collisions = [];
    for (const droppableContainer of droppableContainers) {
        const {
            id
        } = droppableContainer;
        const rect = droppableRects.get(id);
        if (rect) {
            const distBetween = distanceBetween(centerOfRectangle(rect), centerRect);
            collisions.push({
                id,
                data: {
                    droppableContainer,
                    value: distBetween
                }
            });
        }
    }
    return collisions.sort(sortCollisionsAsc);
}
function customCollisionDetectionAlgorithm(args) {
    const pointerCollisions = MClosestCenter(args);
    if (pointerCollisions.length > 0) {
        console.log(args, pointerCollisions);
        return pointerCollisions;
    }
    return rectIntersection(args);
};

const Droppable = ({ id, style, key, children }) => {
    const { setNodeRef } = useDroppable({ id });
    return (
        <div ref={setNodeRef} key={key} style={{ flex: 1, ...style }}>
            {children}
        </div>
    );
};

const Draggable = ({ id,children }) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id });
    const style = {
        // height: (isDragging ?'0px':undefined),
        //transition: 'height 0.2s',
        
      //  transform: CSS.Translate.toString(transform),
    };
    if (isDragging) return '';
    return (
        <DragAndDropContainer name={id} listeners={listeners} attributes={attributes} setNodeRef={setNodeRef}>
             {children}
        </DragAndDropContainer>
    );
};

const DragAndDrop = ({ defaultLeft, defaultRight, children }) => {
    const [leftItems, setLeftItems] = useState(defaultLeft);
    const [rightItems, setRightItems] = useState(defaultRight);

    const [activeId, setActiveId] = useState(null);
    const handleDragStart = (event) => {
        setActiveId(event.active.id);
    };
    
    const [highlightedDroppable, setHighlightedDroppable] = useState(null);

    const handleDragEnd = (event) => {
        setActiveId(null);
        setHighlightedDroppable(null);

        const { active, over } = event;
        if (!over) return;

        //console.log(active.id, over.id);

        const sourceItems = leftItems.includes(active.id) ? leftItems : rightItems;
        const destinationItems = over.id.startsWith('droppable-left') ? leftItems : rightItems;

        const movedItem = active.id;
        const toIndex = +over.id.split('-').pop();

        if (sourceItems === destinationItems) {
            // Same droppable
            // Перетаскивание в тот же список
            let newItems = [...sourceItems];
            newItems.splice(toIndex, 0, '$' + movedItem);
            const oldIndex = newItems.indexOf(movedItem);
            newItems.splice(oldIndex, 1);
            newItems = newItems.map(x => x.replace('$', ''));
            if (sourceItems === leftItems) {
                setLeftItems(newItems);
            } else {
                setRightItems(newItems);
            }
        } else {
            // Move between droppables
            const newSourceItems = [...sourceItems];
            const oldIndex = sourceItems.indexOf(movedItem);
            newSourceItems.splice(oldIndex, 1);

            const newDestinationItems = [...destinationItems];
            newDestinationItems.splice(toIndex, 0, movedItem);

            if (sourceItems === leftItems) {
                setLeftItems(newSourceItems);
                setRightItems(newDestinationItems);
            } else {
                setRightItems(newSourceItems);
                setLeftItems(newDestinationItems);
            }
        }
    };

    const handleDragOver = (event) => {
        const { active, over } = event;
        setHighlightedDroppable(over ? over.id : null);
    };
    //console.log(highlightedDroppable);

    const renderDroppableWithDraggables = (items, side) => {
        return items.flatMap((item, index) => [
            <Droppable
                key={`droppable-${side}-${index}`}
                id={`droppable-${side}-${index}`}
                style={{
                    height: highlightedDroppable === `droppable-${side}-${index}` ? '35px' : undefined,
                    transition: 'height 0.2s',
                    //backgroundColor: highlightedDroppable === `droppable-${side}-${index}` ? '#e0e0e0' : '#f9f9f9',
                }}
            />,
            <Draggable key={item} id={item}>
                    {children.find(child => child.props.name === item).props.children}
            </Draggable>
        ]).concat([
            <Droppable
                key={`droppable-${side}-${items.length}`}
                id={`droppable-${side}-${items.length}`}
                style={{
                    height: highlightedDroppable === `droppable-${side}-${items.length}` ? '35px' : undefined,
                    transition: 'height 0.2s',
                    //backgroundColor: highlightedDroppable === `droppable-${side}-${index}` ? '#e0e0e0' : '#f9f9f9',
                }}
            />
        ]);
    };

    return (
        <DndContext onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd} collisionDetection={customCollisionDetectionAlgorithm}>
            <div style={{ display: 'flex', alignItems: 'flex-start', height: '100%' }}>
                <SplitPane
                    left={
                        renderDroppableWithDraggables(leftItems, 'left')
                    }
                    right={ 
                       renderDroppableWithDraggables(rightItems, 'right')
                    }
                    noNeedInset={true}
                   />
            </div>
            <DragOverlay>
                {activeId ? (
                    <div className="insetdiv" style={{ padding: '0px', margin: '5px' }} >
                        <div style={{ cursor: 'grab', padding: '5px' }}>
                            <strong>{activeId}</strong>
                        </div>
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
};

export default DragAndDrop;
