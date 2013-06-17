window.requestAnimFrame = (function(callback) {
        return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame ||
        function(callback) {
          window.setTimeout(callback, 1000 / 60);
        };
      })();

if( /Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(navigator.userAgent) ) {
var detect = document.createElement('p');
detect.innerHTML = 'You seem to be in a mobile device';
var body = document.getElementById('body');
body.appendChild(detect);
}
var my = {

    globalVars: {

        projectionParameters: {
            win_width: 960,
            win_height:600,
            fov: 150,
            viewer_distance: 200
        },
        galleryImageSize: {
            width: 4400,
            height: 510
        },
        vSlicesFactor: 0.05,
        centerOfTheLastColumn: 4400 / 2, // galleryImageSize.width / 2
        releasedRight: true,
        releasedLeft: true
    },

    constructors: {

        point3D: function(x, y, z) {
            var that = {};
            that.x = x;
            that.y = y;
            that.z = z;
            that.translate = function(dx,dy,dz) {
                var x = that.x + dx;
                var y = that.y + dy;
                var z = that.z + dz;
                return my.constructors.point3D(x, y, z);
            };
            that.moveTo = function(x,y,z) {
                return my.constructors.point3D(x, y, z);
            };
            that.rotateX = function(angle) {
                rad = angle * Math.PI / 180;
                cosa = Math.cos(rad);
                sina = Math.sin(rad);
                var y = that.y * cosa - that.z * sina;
                var z = that.y * sina + that.z * cosa;
                return my.constructors.point3D(that.x, y, z);
            };
            that.rotateY = function(angle) {
                rad = angle * Math.PI / 180;
                cosa = Math.cos(rad);
                sina = Math.sin(rad);
                var z = that.z * cosa - that.x * sina;
                var x = that.z * sina + that.x * cosa;
                return my.constructors.point3D(x, that.y, z);
            };
            that.rotateZ = function(angle) {
                rad = angle * Math.PI / 180;
                cosa = Math.cos(rad);
                sina = Math.sin(rad);
                var x = that.x * cosa - that.y * sina;
                var y = that.x * sina + that.y * cosa;
                return my.constructors.point3D(x, y, that.z);
            };
            that.project = function(win_width, win_height, fov, viewer_distance) {
                var factor = fov / (viewer_distance + that.z);
                var x = that.x * factor + win_width / 2;
                var y = -that.y * factor + win_height / 2;
                return my.constructors.point3D(x, y, 0);
            };
            return that;
        },

        polyhedron3D: function(vertices, edges, faces) {
            var that = {};
            that.vertices = vertices || [];
            that.edges = edges || [];
            that.faces = faces || [];
            that.images = {};
            that.rotationStatus = {x: 0, y: 0, z: 0};
            that.getCenter = function() {
                var x = 0;
                var y = 0;
                var z = 0;
                for (var i = 0; i < that.vertices.length; i++) {
                    x += that.vertices[i].x;
                    y += that.vertices[i].y;
                    z += that.vertices[i].z;
                }
                x = x / that.vertices.length;
                y = y / that.vertices.length;
                z = z / that.vertices.length;
                return my.constructors.point3D(x, y, z);
            };
            that.translate = function(dx, dy, dz) {
                for (var i = 0; i < that.vertices.length; i++) {
                    that.vertices[i].x += dx;
                    that.vertices[i].y += dy;
                    that.vertices[i].z += dz;
                }
                return that;
            };
            that.moveTo = function(x,y,z) {
                var c = that.getCenter();
                var dx = x - c.x;
                var dy = y - c.y;
                var dz = z - c.z;
                return that.translate(dx, dy, dz);
            };
            that.rotateX = function(angle) {
                for (var i = 0; i < that.vertices.length; i++) {
                    that.vertices[i] = that.vertices[i].rotateX(angle);
                }
                that.rotationStatus.x += angle;
                return that;
            };
            that.rotateY = function(angle) {
                for (var i = 0; i < that.vertices.length; i++) {
                    that.vertices[i] = that.vertices[i].rotateY(angle);
                }
                that.rotationStatus.y += angle;
                return that;
            };
            that.rotateZ = function(angle) {
                for (var i = 0; i < that.vertices.length; i++) {
                    that.vertices[i] = that.vertices[i].rotateZ(angle);
                }
                that.rotationStatus.z += angle;
                return that;
            };
            that.getProjectionCoordinates = function(win_width, win_height, fov, viewer_distance) {
                v = [];
                for (var i = 0; i < polyhedron3D.vertices.length; i++) {
                    v[i] = polyhedron3D.vertices[i].project(
                            win_width       || 400,
                            win_height      || 400,
                            fov             || 128,
                            viewer_distance || 200);
                }
                return v;
            };
            that.combine = function(p3D) {
                var v = that.vertices.length;
                var e = that.edges.length;
                var f = that.faces.length;
                for (var i = 0; i < p3D.vertices.length; i++) {
                    that.vertices[v + i] = p3D.vertices[i];
                }
                for (var j = 0; j < p3D.edges.length; j++) {
                    that.edges[e + j] = [p3D.edges[j][0] + v, p3D.edges[j][1] + v];
                }
                for (var k = 0; k < p3D.faces.length; k++) {
                    that.faces[f + k] = [];
                    for (var l = 0; l < p3D.faces[k].length; l++) {
                        that.faces[f + k][l] = p3D.faces[k][l] + v;
                    }
                }
                return that;
            };
            that.loadImageonFace = function(img, n) {
                that.images[n] = img;
            };
            return that;
        },

        square3D: function(l) {
            if (typeof(l) !== "number") throw "Please, specify a valid length.";
            var vertices = [my.constructors.point3D((-l/2),   l/2 ,  0),
                            my.constructors.point3D(  l/2 ,   l/2 ,  0),
                            my.constructors.point3D(  l/2 , (-l/2),  0),
                            my.constructors.point3D((-l/2), (-l/2),  0)];
            var edges = [[0,1], [1,2], [2,3], [3,0]];
            var faces = [[0,1,2,3,0]];
            return my.constructors.polyhedron3D(vertices, edges, faces);
        },

        squaresWall3D: function() {
            var o = my.constructors.polyhedron3D();
            for (var x = -1000; x < 1100; x += 10) {
                for (var y = -10; y < 20; y += 10) {
                    square = my.constructors.square3D(8).moveTo(x, y, 0);
                    o = o.combine(square);
                }
            }
            return o;
        },

        rectangle3D: function(w, h, image) {
            if (typeof(w) !== "number" || typeof(h) !== "number")
                throw "Please, specify a valid width/length.";
            var vertices = [my.constructors.point3D((-w/2),   h/2 ,  0),
                            my.constructors.point3D(  w/2 ,   h/2 ,  0),
                            my.constructors.point3D(  w/2 , (-h/2),  0),
                            my.constructors.point3D((-w/2), (-h/2),  0)];
            var edges = [[0,1], [1,2], [2,3], [3,0]];
            var faces = [[0,1,2,3,0]];
            var that = my.constructors.polyhedron3D(vertices, edges, faces);
            that.image = image;
            that.width = w;
            that.height = h;
            that.numVSlices = that.width * my.globalVars.vSlicesFactor;
            that.numHSlices = that.height * my.globalVars.vSlicesFactor;
            that.gridLength = that.numVSlices * that.numHSlices;
            that.vSlicesWidth = that.width / that.numVSlices;
            that.hSlicesHeight = that.height / that.numHSlices;
            that.vSlices = [];
//            that.hSlices = [];
            if (image) {
                for (var i = 0; i < that.numVSlices; i++) {
                    that.vSlices[i] = my.constructors.rectangle3D(that.vSlicesWidth, that.height);
                    that.vSlices[i] = that.vSlices[i].translate(i * that.vSlicesWidth - w / 2, 0, 0);
                }
//                for (i = 0; i < that.numHSlices; i++) {
//                    that.hSlices[i] = my.constructors.rectangle3D(that.width, that.hSlicesHeight);
//                    that.hSlices[i] = that.hSlices[i].translate(0, (-that.height/2) + i * that.hSlicesHeight, 0);
//                }
//                that.rotateX = function(angle) {
//                    for (var i = 0; i < that.vertices.length; i++) {
//                        that.vertices[i] = that.vertices[i].rotateX(angle);
//                    }
//                    for (i = 0; i < that.vSlices.length; i++) {
//                        that.vSlices[i] = that.vSlices[i].rotateX(angle);
//                    }
//                    for (i = 0; i < that.hSlices.length; i++) {
//                        that.hSlices[i] = that.hSlices[i].rotateX(angle);
//                    }
//                    that.rotationStatus.x += angle;
//                    return that;
//                };
                that.rotateY = function(angle) {
                    for (var i = 0; i < that.vertices.length; i++) {
                        that.vertices[i] = that.vertices[i].rotateY(angle);
                    }
                    for (i = 0; i < that.vSlices.length; i++) {
                        that.vSlices[i] = that.vSlices[i].rotateY(angle);
                    }
//                    for (i = 0; i < that.hSlices.length; i++) {
//                        that.hSlices[i] = that.hSlices[i].rotateY(angle);
//                    }
                    that.rotationStatus.y += angle;
                    return that;
                };
                that.translate = function(dx, dy, dz) {
                    for (var i = 0; i < that.vertices.length; i++) {
                        that.vertices[i].x += dx;
                        that.vertices[i].y += dy;
                        that.vertices[i].z += dz;
                    }
                    for (i = 0; i < that.vSlices.length; i++) {
                        that.vSlices[i] = that.vSlices[i].translate(dx, dy, dz);
                    }
                    return that;
                };
                that.draw = function(context) {
                    my.functions.draw.imageOn3DRectangle(context, that.image, that);
                };
            }
            return that;
        },

        imagesWallArray3D: function(width, height, images) {
            // the space between images is width / 10
            var columns = Math.ceil(images.length / 3);
            var totalWidth = columns * width * 11 / 10;
            var xMax = totalWidth / 2 + 1;
            var yMax = height + width / 10 + 1;
            var that = [];
            var i = 0;
            for (var x = 1 - xMax; x < xMax; x += width * 11 / 10) {
                for (var y = 1 - yMax; y < yMax; y += height + width / 10) {
                    r = my.constructors.rectangle3D(width, height, images[i]).moveTo(x, y, 0);
                    that[i] = r;
                    i++;
                }
            }
            // i need this to stop the translation of the gallery
            my.globalVars.centerOfTheLastColumn = xMax - width / 2;
            return that;
        },

        animationData: function(object3D, linearSpeed, angularSpeed, onOff, rightLeft) {
            that = {};
            that.o = object3D;
            that.linearSpeed = linearSpeed;
            that.angularSpeed = angularSpeed;
            that.onOff = onOff;
            that.rightLeft = rightLeft;
            that.canvas = document.getElementById('gallery');
            that.context = that.canvas.getContext('2d');
            that.startTime = (new Date()).getTime;
            return that;
        },

        scene: function(center) {
            var img = document.getElementById('cesta');
            var s = my.globalVars.galleryImageSize;
            r = my.constructors.rectangle3D(s.width, s.height, img);
            return r;
        }
    },

    functions: {

        draw: {
            polyhedron3D: function(polyhedron3D, context) {
                var p = my.globalVars.projectionParameters;
                var v = [];
                for (var i = 0; i < polyhedron3D.vertices.length; i++) {
                    v[i] = polyhedron3D.vertices[i].project(
                            p.win_width,
                            p.win_height,
                            p.fov,
                            p.viewer_distance
                            );
                }
                context.beginPath();
                context.moveTo(v[polyhedron3D.edges[0][0]].x, v[polyhedron3D.edges[0][0]].y);
                context.lineTo(v[polyhedron3D.edges[0][1]].x, v[polyhedron3D.edges[0][1]].y);
                for (var j = 1; j < polyhedron3D.edges.length; j++) {
                    var a = polyhedron3D.edges[j - 1][1];
                    var b = polyhedron3D.edges[j][0];
                    if (a === b) {
                        context.lineTo(v[polyhedron3D.edges[j][1]].x, v[polyhedron3D.edges[j][1]].y);
                    } else {
                        context.moveTo(v[polyhedron3D.edges[j][0]].x, v[polyhedron3D.edges[j][0]].y);
                        context.lineTo(v[polyhedron3D.edges[j][1]].x, v[polyhedron3D.edges[j][1]].y);
                    }
                }
                context.stroke();
            },

            imageOn3DRectangle: function(context, img, rectangle3D) {
                for (var i = 0; i < rectangle3D.vSlices.length; i++) {
                    var sourceWidth = img.width / rectangle3D.numVSlices;
                    var sourceHeight = img.height;
                    var p = my.globalVars.projectionParameters;
                    var p1 = rectangle3D.vSlices[i].vertices[0].project(
                            p.win_width,
                            p.win_height,
                            p.fov,
                            p.viewer_distance
                            );

                    var p2 = rectangle3D.vSlices[i].vertices[2].project(
                            p.win_width,
                            p.win_height,
                            p.fov,
                            p.viewer_distance
                            );
                    var sourceX = sourceWidth * i;
                    var sourceY = 0;
                    var destX = p1.x;
                    var destY = p1.y;
                    var destWidth = p2.x - p1.x;
                    var destHeight = p2.y - p1.y;
                    try {
                    context.drawImage(
                            img, sourceX, sourceY, sourceWidth, sourceHeight,
                            destX, destY, destWidth, destHeight);
                    }
                    finally {continue;}
                }
    //            for (i = 0; i < rectangle3D.hSlices.length; i++) {
    //                var sourceWidthH = img.width;
    //                var sourceHeightH = img.height / rectangle3D.numHSlices;
    //                var p1H = rectangle3D.hSlices[i].vertices[0].project(400, 400, 128, 200);
    //                var p2H = rectangle3D.hSlices[i].vertices[2].project(400, 400, 128, 200);
    //                var sourceXH = 0;
    //                var sourceYH = sourceHeightH * i;
    //                var destXH = p1H.x;
    //                var destYH = p1H.y;
    //                var destWidthH = p2H.x - p1H.x;
    //                var destHeightH = p2H.y - p1H.y;
    //                context.drawImage(
    //                        img, sourceXH, sourceYH, sourceWidthH, sourceHeightH,
    //                        destXH, destYH, destWidthH, destHeightH);
    //            }
            },

            scene: function(animationData) {
                var canvas = document.getElementById('gallery');
                var context = canvas.getContext('2d');
                r = my.constructors.scene();
                if (!my.currentData)
                    my.currentData = my.constructors.animationData(r, 1, 0.01);
                o = my.currentData.o;
                o.draw(context);
            }
        },

        animate: function(d) {
            d.canvas.width = d.canvas.width;
            var time = (new Date()).getTime() - d.startTime;
            d.angleChange = d.angularSpeed * time * 2 * Math.PI / 1000;
            if (d.rightLeft === 'right') {
                if (d.onOff === 'on') {
                    my.globalVars.releasedRight = false;
                    if (d.o.rotationStatus.y > -10) d.o.rotateY(-0.5);
                    if (d.o.getCenter().x > -my.globalVars.centerOfTheLastColumn) {
                        d.o.translate(-Math.cos(10 * Math.PI / 180)*9, 0, -Math.sin(10 * Math.PI / 180)*9);
                    } else {
                        my.handlers.turnRight.bre.apply(document.getElementById('der'));
                    }
                }
                if (d.onOff === 'off') {
                    my.globalVars.releasedRight = false;
                    if (d.o.rotationStatus.y < 0) {
                        d.o.rotateY(0.9);
                    } else if (d.o.getCenter().z < 0) {
                        d.o.rotateY(-d.o.rotationStatus.y);
                        d.o.translate(0, 0, 1);
                    }
                    else {
                        d.o.translate(0, 0, -d.o.getCenter().z);
                        my.functions.draw.scene(d);
                        my.currentData = d;
                        my.globalVars.releasedRight = true;
                        return;
                    }
                }
            } else if (d.rightLeft === 'left') {
                if (d.onOff === 'on') {
                    my.globalVars.releasedLeft = false;
                    if (d.o.rotationStatus.y < 10) d.o.rotateY(0.5);
                    if (d.o.getCenter().x < my.globalVars.centerOfTheLastColumn) {
                        d.o.translate(Math.cos(10 * Math.PI / 180)*9, 0, -Math.sin(10 * Math.PI / 180)*9);
                    } else {
                        my.handlers.turnRight.bre.apply(document.getElementById('izq'));
                    }
                }
                if (d.onOff === 'off') {
                    my.globalVars.releasedLeft = false;
                    if (d.o.rotationStatus.y > 0) {
                        d.o.rotateY(-0.9);
                    } else if (d.o.getCenter().z < 0) {
                        d.o.rotateY(-d.o.rotationStatus.y);
                        d.o.translate(0, 0, 1);
                    }
                    else {
                        d.o.translate(0, 0, -d.o.getCenter().z);
                        my.functions.draw.scene(d);
                        my.currentData = d;
                        my.globalVars.releasedLeft = true;
                        return;
                    }
                }
            }
            my.functions.draw.scene(d);
            my.currentData = d;
            requestAnimFrame(function() {
                my.functions.animate(d);
            });
        },

        animateOrWait: function(onOff, rightLeft) {
            if (my.globalVars.releasedRight === false && rightLeft === 'right' ||
                    my.globalVars.releasedLeft === false && rightLeft === 'left') {
                my.currentData.onOff = onOff;
                my.currentData.rightLeft = rightLeft;
                my.currentData.startTime = (new Date()).getTime();
                my.functions.animate(my.currentData);
            } else if (my.globalVars.releasedRight === true && rightLeft === 'left' ||
                    my.globalVars.releasedLeft === true && rightLeft === 'right') {
                var img = document.getElementById('cesta');
                if (my.currentData) {
                    var c = my.currentData.o.getCenter();
                    var s = my.globalVars.galleryImageSize;
                    var r = my.constructors.rectangle3D(s.width, s.height, img).moveTo(c.x, c.y, c.z);
                    my.currentData = my.constructors.animationData(r, 1, 0.01, onOff, rightLeft);
                    my.functions.animate(my.currentData);
                } else {
                    var ss = my.globalVars.galleryImageSize;
                    var rr = my.constructors.rectangle3D(ss.width, ss.height, img);
                    my.currentData = my.constructors.animationData(rr, 1, 0.01, onOff, rightLeft);
                    my.functions.animate(my.currentData);
                }
            } else if (my.globalVars.releasedRight === false && rightLeft === 'left' ||
                    my.globalVars.releasedLeft === false && rightLeft === 'right') {
                my.globalVars.t = setTimeout(function(){my.functions.animateOrWait(onOff, rightLeft);}, 200);
            }
        },

        setBackground: function (el, color) {
            el.style.backgroundColor = color;
        }
    },

    handlers: {
        turnRight: {
            acc: function() {
                clearTimeout(my.globalVars.t);
                var that = this;
                my.functions.setBackground(that, 'red');
                my.functions.animateOrWait('on', 'right');
            },
            bre: function() {
                clearTimeout(my.globalVars.t);
                var that = this;
                my.functions.setBackground(that, '');
                my.currentData.onOff = 'off';
                my.currentData.startTime = (new Date()).getTime();
                my.functions.animate(my.currentData);
            }
        },
        turnLeft: {
            acc: function() {
                clearTimeout(my.globalVars.t);
                var that = this;
                my.functions.setBackground(that, 'red');
                my.functions.animateOrWait('on', 'left');
                // console.log('hola');
            },
            bre: function() {
                clearTimeout(my.globalVars.t);
                var that = this;
                my.functions.setBackground(that, '');
                my.currentData.onOff = 'off';
                my.currentData.startTime = (new Date()).getTime();
                my.functions.animate(my.currentData);
            }
        },

        drawScene: function() {
            my.functions.draw.scene();
        }
    }
};


var der = document.getElementById('der');
der.onmouseover = my.handlers.turnRight.acc;
der.onmouseout = my.handlers.turnRight.bre;
var izq = document.getElementById('izq');
izq.onmouseover = my.handlers.turnLeft.acc;
izq.onmouseout = my.handlers.turnLeft.bre;
window.onload = function() {
    my.functions.draw.scene();
};
