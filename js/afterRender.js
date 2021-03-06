// Global counter of triangle markers used to generate unique ids
// it's important to have unique id because there can be multiple
// markers within nodes that can be colored differently
var markersCount = 0;

// This function is called from body's "onload" attribute
function addVisualizationLayouts() {
    if(isPrintMode()) {
        document.body.style.width = '595px';
        setTimeout(function () { window.print(); }, 100);
    }
    applySplits();
    applyJoins();
    applyRenumbering();
}

function isPrintMode() {
    return !window.frameElement;
}

function applyRenumbering() {
    var renbrAttr = 'renumberingfrom';
    var equalCells = Array.prototype.slice.call(document.querySelectorAll("*["+renbrAttr+"]"));
    equalCells.sort(function(nodeA, nodeB) {
        var nrA = nodeA.getAttribute(renbrAttr),
            nrB = nodeB.getAttribute(renbrAttr);
        if (nrA < nrB) return -1;
        if (nrA > nrB) return 1;
        return 0;
    });

    var arrowsRenumbering = [], iconsRenumbering = [], pastRenumberings = [];
    for(var i = 0; i < equalCells.length; i++) {
        var firstCell = equalCells[i],
            equalId = firstCell.getAttribute(renbrAttr),
            secondCell = document.querySelectorAll("*[renumberingto='"+equalId+"']").item(0);
        if(secondCell && pastRenumberings.indexOf(equalId) == -1) {
            try {
                createWrapper(firstCell);
                createWrapper(secondCell);
                // TODO: uncomment to limit the arrows to one arrow per line
                // var firstOppositeRenumbering = getOppositeTd(firstCell).getAttribute('renumberingto');
                // var secondOppositeRenumbering = getOppositeTd(secondCell).getAttribute(renbrAttr);
                // var drawArrow = !((firstOppositeRenumbering || secondOppositeRenumbering) &&
                //                 ((pastRenumberings.indexOf(firstOppositeRenumbering) != -1) ||
                //                 (pastRenumberings.indexOf(secondOppositeRenumbering) != -1)));
                var cells = [];
                if(getPosInParent(firstCell) > getPosInParent(secondCell)) {
                    cells = [secondCell, firstCell, false];
                } else {
                    cells = [firstCell, secondCell, true];
                }
                //if (drawArrow) {
                    cells.push(getRandColor(2));
                    arrowsRenumbering.push(cells);
                //}

                iconsRenumbering.push(cells);
                pastRenumberings.push(equalId);
            } catch(e) {
                console.error(e);
            }
        }
    }
    // Adding the icons first because the spaces could change
    iconsRenumbering.forEach(function(cells) {
        createRenumberingIcon(cells[0], cells[1]);
    });
    arrowsRenumbering.forEach(function(cells) {
        createRenumberingCellBox(cells[0], cells[1], cells[2], cells[3]);
    });
}

function getOppositeTd(tdNode) {
    var tr = getParentByName(tdNode, 'tr');
    return tr.children[1-getPosInParent(tdNode)];
}

function createWrapper(element) {
    if (element.childNodes.length > 1 || element.firstChild.nodeName == "SPAN") {
        var p = document.createElement("p");
        while(element.firstChild) {
            p.appendChild(element.firstChild);
        }
        element.appendChild(p);
    }
}

function createRenumberingCellBox(firstCell, secondCell, leftToRight, color) {
    var firstEl = firstCell.firstChild || firstCell,
        secondEl = secondCell.firstChild || secondCell,
        styleFist = window.getComputedStyle(firstEl),
        widthF = parseInt(styleFist.getPropertyValue('width')),
        heightF = parseInt(styleFist.getPropertyValue('height')),
        styleSecond = window.getComputedStyle(secondEl),
        widthS = parseInt(styleSecond.getPropertyValue('width')),
        heightS = parseInt(styleSecond.getPropertyValue('height')),
        firstPos = getPos(firstEl),
        secondPos = getPos(secondEl),
        boxX = firstPos.x+widthF,
        startY = Math.min(firstPos.y, secondPos.y),
        boxH = Math.max(firstPos.y, secondPos.y)-startY+Math.max(heightS, heightF);

     var svgBoxSettings = {
        pos : {
            x : boxX,
            y : startY
        },
        size : {
            w : secondPos.x-boxX,
            h : boxH
        }
    };

    if(!isNaN(svgBoxSettings.pos.x) &&
        !isNaN(svgBoxSettings.pos.y) &&
        !isNaN(svgBoxSettings.size.w) && !isNaN(svgBoxSettings.size.h)) {
        var svgBox = createArrowsBox(svgBoxSettings);
        var svgGroup = createColoredGroup(svgBox, color);
        firstPos.y = firstPos.y-startY;
        firstPos.x = 0;
        secondPos.y = secondPos.y-startY;
        secondPos.x = svgBoxSettings.size.w;
        createRenumberingArrows(svgGroup, svgBoxSettings, {
            pos : firstPos,
            size : {
                w : widthF,
                h : heightF
            }
        },{
            pos : secondPos,
            size : {
                w : widthS,
                h : heightS
            }
        }, leftToRight);

        document.body.appendChild(svgBox);
    }
}

function getRandColor(brightness) {
    //6 levels of brightness from 0 to 5, 0 being the darkest
    var rgb = [Math.random() * 256, Math.random() * 256, Math.random() * 256];
    var mix = [brightness*51, brightness*51, brightness*51]; //51 => 255/5
    var mixedrgb = [rgb[0] + mix[0], rgb[1] + mix[1], rgb[2] + mix[2]].map(function(x){ return Math.round(x/2.0);});
    return "rgb(" + mixedrgb.join(",") + ")";
}

function createColoredGroup(node, color) {
    var g = createSvgElement('g', {
        stroke: color,
        fill: color
    });
    return node.appendChild(g);
}

function createRenumberingIcon(fromNode, toNode) {
    var targetNode = toNode && toNode.querySelector('p');
    targetNode = targetNode || toNode;
    var infoImg = document.createElement('img');
    var oldText = 'Previous: '+fromNode.textContent;
    infoImg.setAttribute('src', 'data/renumberIcon.svg');
    infoImg.setAttribute('width', '40px');
    infoImg.setAttribute('height', '40px');
    infoImg.setAttribute('style', 'vertical-align:middle');
    var aNode = document.createElement('a');
    aNode.setAttribute('class', 'renumberingIcon');
    aNode.setAttribute('data-title', oldText);
    aNode.appendChild(infoImg);
    targetNode.appendChild(aNode);
}

function applyJoins() {
    var joins = document.querySelectorAll("*[joined]");

    for (var i = 0; i < joins.length; i++) {
        var el = joins[i], td = getParentByName(el, "td");
        drawElJoin(el, td);
    }
}

function drawElJoin(el, td) {
    var joinId = el.getAttribute('joined'),
        nodesToJoin = document.querySelectorAll("*[joininto='"+joinId+"']"),
        oppositeTdsBBox = getNodesBBox(nodesToJoin);
    drawArrows(el, td, oppositeTdsBBox, 'join');
}

function drawElSplit(el, td) {
    var splitId = el.getAttribute('tosplit'),
        nodesSplitted = document.querySelectorAll("*[splittedby='"+splitId+"']"),
        oppositeTdsBBox = getNodesBBox(nodesSplitted);
    drawArrows(el, td, oppositeTdsBBox, 'split');
}

function drawArrows(el, td, oppositeTdsBBox, arrowsType) {
    var style = window.getComputedStyle(el),
        width = parseInt(style.getPropertyValue("width")),
        height = parseInt(style.getPropertyValue("height")),
        pos = getPos(el),
        tdPosInParent = getPosInParent(td);

    if ( oppositeTdsBBox.size.h > height ) {
        var rows = oppositeTdsBBox.elements.map(function(el) {
            return getParentByName(el.node, "tr");
        });
        if (rows[0] === rows[rows.length-1])
            el.style.height = oppositeTdsBBox.size.h;
    }
    var sboxY = Math.min(oppositeTdsBBox.pos.y, pos.y);
    var oppositeTotalHeight = oppositeTdsBBox.pos.y-sboxY+oppositeTdsBBox.size.h;
    var elTotalHeight = pos.y-sboxY+height;
    var svgBoxSettings = {
        pos : {
            x : (tdPosInParent) ? oppositeTdsBBox.pos.x + oppositeTdsBBox.size.w: (pos.x + width),
            y : sboxY
        }, 
        size: {
            w : (tdPosInParent) ? (pos.x - (oppositeTdsBBox.pos.x + oppositeTdsBBox.size.w)) : (oppositeTdsBBox.pos.x - (pos.x + width)),
            h : Math.max(oppositeTotalHeight, elTotalHeight)
        }
    };

    var svgBox = createArrowsBox(svgBoxSettings);
    var svgGroup = createColoredGroup(svgBox, 'blue');
    createArrows(svgGroup, svgBoxSettings, {
        pos : pos,
        size : {
            w : width,
            h : height
        },
        direction: tdPosInParent
    }, oppositeTdsBBox, arrowsType);
    document.body.appendChild(svgBox);
}

function getNodesBBox(nodes) {
    var result = {}, sizesAndPos = [], minX, minY, totW = 0, totH = 0, prevYH;

    for (var i = 0; i < nodes.length; i++) {
        var targetEl = nodes[i];
        targetEl = (targetEl.nodeName.toLowerCase() == 'td' && targetEl.firstElementChild) ?
                        targetEl.firstElementChild : targetEl;

        var pos = getPos(targetEl),
            style = window.getComputedStyle(nodes[i]),
            size = {
                w : parseInt(style.getPropertyValue("width")),
                h : parseInt(style.getPropertyValue("height"))
            };

        minX = (!minX || pos.x < minX) ? pos.x : minX;
        minY = (!minY || pos.y < minY) ? pos.y : minY;

        totW = (!totW || size.w > totW) ? size.w : totW;

        totH += size.h;
        totH = (prevYH) ? totH + pos.y - prevYH : totH;
        sizesAndPos.push({
            node : nodes[i],
            pos : pos,
            size : size
        });
        prevYH = pos.y + size.h;
    }

    result.pos = {
        x : minX,
        y : minY
    };
    result.size = {
        w : totW,
        h : totH
    };
    result.elements = sizesAndPos;
    return result;
}

function applySplits() {
    var splitted = document.querySelectorAll("*[tosplit]");
    for (var i = 0; i < splitted.length; i++) {
        var el = splitted[i], td = getParentByName(el, "td");
        drawElSplit(el, td);
    }
}

function getPos(el) {
    for (var lx = 0, ly = 0; el !== null; lx += el.offsetLeft, ly += el.offsetTop, el = el.offsetParent);
    return {
        x : lx,
        y : ly
    };
}

function createSvg(width, height, style) {
    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute('style', style);
    svg.setAttribute('width', width);
    svg.setAttribute('height', height);
    svg.setAttributeNS("http://www.w3.org/2000/xmlns/", "xmlns:xlink", "http://www.w3.org/1999/xlink");
    return svg;
}

function createSvgElement(name, attributes) {
    var svg = document.createElementNS("http://www.w3.org/2000/svg", name);
    if (attributes) {
        for (var i in attributes) {
            svg.setAttribute(i, attributes[i]);
        }
    }
    return svg;
}

function getPosInParent(node) {
    var parent = node.parentNode, iterNode = parent.firstElementChild, counter = 0;
    while (iterNode) {
        if (iterNode == node) {
            return counter;
        }
        iterNode = iterNode.nextElementSibling;
        counter++;
    }
    return null;
}

function getParentByName(node, name) {
    var iterNode = node.parentNode;
    name = name.toLowerCase();
    while (iterNode && iterNode.nodeName.toLowerCase() != name)
    iterNode = iterNode.parentNode;

    return (iterNode && iterNode.nodeName.toLowerCase() == name) ? iterNode : false;
}

function createArrowsBox(settings) {
    var svg = createSvg(settings.size.w, settings.size.h, 
                'position:absolute; top: ' + settings.pos.y +
                '; left: ' + settings.pos.x + '; background-color:rgba(0,255,0,0);');
    return svg;
}

function addMarker(node) {
    var id = 'triangle'+markersCount++;
    var marker = createSvgElement('marker', {
        id : id,
        viewBox : '0 0 10 10',
        refX : '0',
        refY : '5',
        markerUnits : 'strokeWidth',
        markerWidth : '4',
        markerHeight : '3',
        orient : 'auto'
    });
    var path = createSvgElement('path', {
        d : 'M 0 0 L 10 5 L 0 10 z'
    });
    marker.appendChild(path);
    node.appendChild(marker);
    return id;
}

function createArrows(box, boxSettings, td, oppositeTds, type) {
    var xPadding = 3,  tdLineY1, tdLineY2, middleTdY, tdLine, tdLineX;
    type = type || 'join';
    if(td.direction) {
        tdLineY1 = td.pos.y - boxSettings.pos.y;
        tdLineY2 = tdLineY1 + td.size.h;
        middleTdY = tdLineY1 + td.size.h / 2;
        tdLineX = boxSettings.size.w - xPadding;
    } else {
        tdLineY1 = td.pos.y - boxSettings.pos.y;
        tdLineY2 = tdLineY1 + td.size.h;
        middleTdY = tdLineY1 + td.size.h / 2;
        tdLineX = xPadding;
    }
    tdLine = createSvgElement('line', {
        x1 : tdLineX,
        y1 : tdLineY1,
        x2 : tdLineX,
        y2 : tdLineY2,
        'stroke-width' : '2'
    });
    box.appendChild(tdLine);

    var markerId = addMarker(box);
    for (var i = 0; i < oppositeTds.elements.length; i++) {
        var el = oppositeTds.elements[i], arrow, middleY, lineX;

        if(td.direction) {
            tdLineY1 = el.pos.y - boxSettings.pos.y;
            tdLineY2 = tdLineY1 + el.size.h;
            lineX =  xPadding;
        } else {
            tdLineY1 = el.pos.y - boxSettings.pos.y;
            tdLineY2 = tdLineY1 + el.size.h;
            lineX =  boxSettings.size.w - xPadding;
        }

        tdLine = createSvgElement('line', {
            x1 : lineX,
            y1 : tdLineY1,
            x2 : lineX,
            y2 : tdLineY2,
            'stroke-width' : '2'
        });

        middleY = tdLineY1 + (el.size.h / 2);
        box.appendChild(tdLine);

        var arrowCfg = {
            'stroke-width' : '2',
            'marker-end' : 'url(#'+markerId+')'
        };
        if (type == 'split') {
            arrowCfg.x1 = tdLineX;
            arrowCfg.y1 = middleTdY;
            arrowCfg.x2 = (td.direction) ? lineX + 5 : lineX - 5;
            arrowCfg.y2 = middleY;
        } else if (type == 'join') {
            arrowCfg.x1 = lineX;
            arrowCfg.y1 = middleY;
            arrowCfg.x2 = (td.direction) ? tdLineX - 5  : tdLineX + 5;
            arrowCfg.y2 = middleTdY+(i*xPadding*3);
        }

        arrow = createSvgElement('line', arrowCfg);
        box.appendChild(arrow);
    }
}

function createRenumberingArrows(box, boxSettings, first, second, leftToRight) {
    var xPadding = 5, arrowPadding = 7,
        verticalLineX = boxSettings.size.w/2,
        arrowX1 = verticalLineX,
        arrowX2 = 0,
        arrowY1 = 0,
        arrowY2 = 0,
        firstLineToMiddle = '', secondLineToMiddle = '';
    if (leftToRight) {
        arrowX2 = boxSettings.size.w-xPadding-arrowPadding;
        arrowY1 = second.pos.y+(second.size.h/2);
        arrowY2 = arrowY1;
        firstLineToMiddle = ' m0'+' -'+first.size.h/2+' H'+verticalLineX;
    } else {
        arrowX2 = xPadding+arrowPadding;
        arrowY1 = first.pos.y+(first.size.h/2);
        arrowY2 = arrowY1;
        firstLineToMiddle = ' M'+verticalLineX+' '+(first.pos.y+first.size.h/2);
        secondLineToMiddle = ' H'+(boxSettings.size.w-xPadding);
    }

    var pathData = 'M'+first.pos.x+xPadding+' '+first.pos.y+' V'+(first.pos.y+first.size.h)+
            firstLineToMiddle+' V'+(second.pos.y+second.size.h/2)+
            secondLineToMiddle+
            ' M'+(boxSettings.size.w-xPadding)+' '+second.pos.y+
            ' v'+second.size.h;

    var markerId = addMarker(box);
    var path = createSvgElement('path', {
        d: pathData,
        'stroke-width' : 2,
        'fill-opacity': 0 ,
        'stroke-linejoin': 'round'
    });
    box.appendChild(path);
    var arrow = createSvgElement('line', {
        x1 : arrowX1,
        y1 : arrowY1,
        x2 : arrowX2,
        y2 : arrowY2,
        'stroke-width' : 2,
        'marker-end' : 'url(#'+markerId+')'
    });
    box.appendChild(arrow);
}
