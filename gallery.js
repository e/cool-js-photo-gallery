window.requestAnimFrame = (function(callback) {
        return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame ||
        function(callback) {
          window.setTimeout(callback, 1000 / 60);
        };
      })();

var my = {

    globalVars: {},
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
                return my.constructors.point3D(x, y, 1);
            };
            return that;
        },

        polyhedron3D: function(vertices, edges, faces) {
            var that = {};
            that.vertices = vertices || [];
            that.edges = edges || [];
            that.faces = faces || [];
            that.center = function() {
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
                var c = that.center();
                var dx = x - c.x;
                var dy = y - c.y;
                var dz = z - c.z;
                return that.translate(dx, dy, dz);
            };
            that.rotateX = function(angle) {
                for (var i = 0; i < that.vertices.length; i++) {
                    that.vertices[i] = that.vertices[i].rotateX(angle);
                }
                return that;
            };
            that.rotateY = function(angle) {
                for (var i = 0; i < that.vertices.length; i++) {
                    that.vertices[i] = that.vertices[i].rotateY(angle);
                }
                return that;
            };
            that.rotateZ = function(angle) {
                for (var i = 0; i < that.vertices.length; i++) {
                    that.vertices[i] = that.vertices[i].rotateZ(angle);
                }
                return that;
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
            for (var x = -100; x < 110; x += 10) {
                for (var y = -10; y < 20; y += 10) {
                    square = my.constructors.square3D(8).moveTo(x, y, 0);
                    o = o.combine(square);
                }
            }
            return o;
        },

        image3D: function() {
        },

        animationData: function(object3D, linearSpeed, angularSpeed) {
            that = {};
            that.o = object3D;
            that.linearSpeed = linearSpeed;
            that.angularSpeed = angularSpeed;
            that.canvas = document.getElementById('gallery');
            that.context = that.canvas.getContext('2d');
            that.startTime = (new Date()).getTime;
            return that;
        }
    },

    functions: {

        draw3DPolyhedron: function(polyhedron3D, context) {
            var v = [];
            for (var i = 0; i < polyhedron3D.vertices.length; i++) {
                v[i] = polyhedron3D.vertices[i].project(400, 400, 128, 10);
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

        keystoneAndDisplayImage: function(ctx, img, x, y, pixelWidth, scalingFactor) {
            var h = img.height,
            w = img.width,
            
            // The number of slices to draw.
            numSlices = Math.abs(pixelWidth),
            
            // The width of each source slice.
            sliceWidth = w / numSlices,
            
            // Whether to draw the slices in reverse order or not.
            polarity = (pixelWidth > 0) ? 1 : -1,

            // How much should we scale the width of the slice 
            // before drawing?
            widthScale = Math.abs(pixelWidth) / w,
            
            // How much should we scale the height of the slice 
            // before drawing? 
            heightScale = (1 - scalingFactor) / numSlices;

            for(var n = 0; n < numSlices; n++) {
                // Source: where to take the slice from.
                var sx = sliceWidth * n,
                    sy = 0,
                    sWidth = sliceWidth,
                    sHeight = h;
                // Destination: where to draw the slice to 
                // (the transformation happens here).
                var dx = x + (sliceWidth * n * widthScale * polarity),
                // Este es el que hay que cambiar
                    dy = y + ((h * heightScale * n) / 2),
                    dWidth = sliceWidth * widthScale,
                    dHeight = h * (1 - (heightScale * n));
                ctx.drawImage(img, sx, sy, sWidth, sHeight, 
                            dx, dy, dWidth, dHeight);
            }
        },

        animate: function(d) {
            d.canvas.width = d.canvas.width;
            var time = (new Date()).getTime() - d.startTime;
            angleChange = d.angularSpeed * time * 2 * Math.PI / 1000;
            if (d.rightLeft === 'right') {
                if (d.onOff === 'on') {
                    my.globalVars.releasedRight = false;
                    if (d.corners.lineB.x > 300) {
                    }
                }
                if (d.onOff === 'off') {
                    my.globalVars.releasedRight = false;
                    if (d.corners.d.y < my.constants.corners.d.y) {
                    } else {
                        d.corners.d.y = my.constants.corners.d.y;
                        d.corners.b.y = my.constants.corners.b.y;
                        my.globalVars.releasedRight = true;
                        return;
                    }
                }
            } else if (d.rightLeft === 'left') {
                if (d.onOff === 'on') {
                    my.globalVars.releasedLeft = false;
                    d.corners.c.y = (d.corners.c.y > finalDY) ?
                        d.corners.c.y -= speed * time : finalDY;
                    d.corners.a.y = (d.corners.a.y < finalBY) ?
                        d.corners.a.y += speed * time : finalBY;
                }
                if (d.onOff === 'off') {
                    my.globalVars.releasedLeft = false;
                    if (d.corners.c.y < my.constants.corners.c.y) {
                        d.corners.c.y += speed * time;
                        d.corners.a.y -= speed * time;
                    } else {
                        d.corners.c.y = my.constants.corners.c.y;
                        d.corners.a.y = my.constants.corners.a.y;
                        my.functions.draw3DPolyhedron(d.o, d.context, d.dashLength);
                        my.globalVars.releasedLeft = true;
                        return;
                    }
                }
            }
            my.functions.draw3DPolyhedron(d.o, d.context, d.dashLength);
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
                my.currentData = my.constructors.animationData(onOff, rightLeft);
                my.functions.animate(my.currentData);
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
                my.currentData = my.constructors.animationData(squares_wall, 3, 4);
                my.currentData.onOff = 'off';
                my.currentData.startTime = (new Date()).getTime();
                my.functions.animate(my.currentData);
            }
        },
        turnLeft: {
            acc: function() {
                clearTimeout(my.globalVars.t);
                var that = this;
                my.currentData = my.constructors.animationData(squares_wall, 3, 4);
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
        }
    }
};


var der = document.getElementById('der');
der.onmouseover = my.handlers.turnRight.acc;
der.onmouseout = my.handlers.turnRight.bre;
var izq = document.getElementById('izq');
izq.onmouseover = my.handlers.turnLeft.acc;
izq.onmouseout = my.handlers.turnLeft.bre;

var canvas = document.getElementById('gallery');
var c = canvas.getContext('2d');
//var squares_wall = my.constructors.squaresWall3D(3);
var squares_wall = my.constructors.squaresWall3D();
my.functions.draw3DPolyhedron(squares_wall, c);
//var img = new Image();
//img.src = 'k.jpg';
var img = document.getElementById('cesta');
//my.functions.keystoneAndDisplayImage(c, img, 1, 1, img.width * 0.75, 0.8);
// keystoneAndDisplayImage: function(ctx, img, x, y, pixelWidth, scalingFactor) {
