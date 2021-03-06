var b2Vec2 = Box2D.Common.Math.b2Vec2,
    b2BodyDef = Box2D.Dynamics.b2BodyDef,
    b2Body = Box2D.Dynamics.b2Body,
    b2FixtureDef = Box2D.Dynamics.b2FixtureDef,
    b2Fixture = Box2D.Dynamics.b2Fixture,
    b2World = Box2D.Dynamics.b2World,
    b2MassData = Box2D.Collision.Shapes.b2MassData,
    b2PolygonShape = Box2D.Collision.Shapes.b2PolygonShape,
    b2CircleShape = Box2D.Collision.Shapes.b2CircleShape,
    b2DebugDraw = Box2D.Dynamics.b2DebugDraw,
    b2Transform = Box2D.Common.Math.b2Transform,
    b2Mat22 = Box2D.Common.Math.b2Mat22;

function round(num) {
    return (0.5 + num) | 0;
}

function fastAbs(num) {
    // needs to be an integer
    var mask = num >> 63;
    return (mask^num) - mask;
}

function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

function loadImage(src, scale) {
    var image = {};
    image.canvas = document.createElement('canvas');
    image.ctx = image.canvas.getContext('2d');
    var i = new Image();
    i.onload = function () {
        var ratio = i.width / i.height;
        image.canvas.width = 2 * scale * ratio;
        image.canvas.height = 2 * scale;
        image.ctx.drawImage(i, 0, 0, image.canvas.width, image.canvas.height);
    };
    i.src = src;


    return image;
}

function Box(world, width, height, x, y) {
    this.body = null;
    this.width = width;
    this.height = height;
    // body
    var bodyDef = new b2BodyDef();
    bodyDef.type = b2Body.b2_dynamicBody;
    bodyDef.position.x = x;
    bodyDef.position.y = y;
    this.body = world.CreateBody(bodyDef);
    // fixture
    var shape = new b2PolygonShape();
    shape.SetAsBox(width, height, 0.5);
    var fixDef = new b2FixtureDef();
    fixDef.shape = shape;
    fixDef.density = 1;
    this.body.CreateFixture(fixDef);
}

Box.prototype.render = function (ctx, scale) {
    var pos = this.body.GetPosition();
    ctx.save();
    ctx.strokeStyle = '#000000';
    ctx.translate(pos.x * scale, pos.y * scale);
    ctx.rotate(this.body.GetAngle());
    ctx.beginPath();
    ctx.moveTo(-1 * this.width * scale, -1 * this.height * scale);
    ctx.lineTo(this.width * scale, -1 * this.height * scale);
    ctx.lineTo(this.width * scale, this.height * scale);
    ctx.lineTo(-1 * this.width * scale, this.height * scale);
    ctx.lineTo(-1 * this.width * scale, -1 * this.height * scale);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
};

function CachedImageBox(world, cachedImage, x, y, scale) {
    var body = null;
    this.image = cachedImage;
    this.radius = this.calculateRadius();
    // body
    var bodyDef = new b2BodyDef();
    bodyDef.type = b2Body.b2_dynamicBody;
    bodyDef.position.x = x;
    bodyDef.position.y = y;
    this.body = world.CreateBody(bodyDef);

    // fixtures
    var fixDef = new b2FixtureDef();
    fixDef.shape = new b2PolygonShape();
    var width = this.image.canvas.width / (scale * 2);
    var height = this.image.canvas.height / (scale * 2);
    fixDef.shape.SetAsBox(width, height, 0.5);
    fixDef.density = 1;
    this.body.CreateFixture(fixDef);
}

CachedImageBox.prototype.render = function (ctx, scale) {
    var pos = this.body.GetPosition();
    ctx.save();
    ctx.translate(pos.x * scale, pos.y * scale);
    ctx.rotate(this.body.GetAngle());
    ctx.drawImage(this.image.canvas, -1 * round(this.image.canvas.width / 2), -1 * round(this.image.canvas.height / 2));
    ctx.restore();
};

CachedImageBox.prototype.clear = function(ctx, scale) {
    var pos = this.body.GetPosition();
    ctx.clearRect(pos.x*scale-this.radius, pos.y*scale-this.radius, this.radius*2, this.radius*2);
}

CachedImageBox.prototype.calculateRadius = function () {
    var width = this.image.canvas.width / 2;
    var height = this.image.canvas.height / 2;
    return Math.sqrt(width * width + height * height) + 60;
};

CachedImageBox.prototype.topBoundDistance = function (scale) {
    return this.body.GetPosition().y * scale - this.radius;
};

CachedImageBox.prototype.bottomBoundDistance = function (scale) {
    return this.body.GetPosition().y * scale + this.radius;
};

CachedImageBox.prototype.leftBoundDistance = function (scale) {
    return this.body.GetPosition().x * scale - this.radius;
};

CachedImageBox.prototype.rightBoundDistance = function (scale) {
    return this.body.GetPosition().x * scale + this.radius;
};

CachedImageBox.prototype.stillIn = function (canvas, scale) {
    var pos = this.body.GetPosition();
    return pos.y * scale - this.radius <= canvas.height;
};

var clickDropVariables = null;

function clickDropInit(args) {
    clickDropVariables = {};
    clickDropVariables.scale = args.scale;
    clickDropVariables.images = new Array();
    args.images.forEach(function (image) {
        clickDropVariables.images.push(loadImage(image, clickDropVariables.scale));
    });
    clickDropVariables.things = new Array();
    clickDropVariables.world = new b2World(new b2Vec2(0, 50), true);

    clickDropVariables.canvas = document.createElement('canvas');
    clickDropVariables.canvas.style.position = 'fixed';
    clickDropVariables.canvas.style.top = '0px';
    clickDropVariables.canvas.style.left = '0px';
    clickDropVariables.canvas.style.zIndex = 3;
    clickDropVariables.canvas.style.pointerEvents = 'none';

    clickDropVariables.ctx = clickDropVariables.canvas.getContext('2d');
    document.getElementsByTagName('body')[0].appendChild(clickDropVariables.canvas);

    window.onmousedown = function (e) {
        var newThing = new CachedImageBox(world,
            clickDropVariables.images[randInt(0, clickDropVariables.images.length - 1)],
            e.clientX / clickDropVariables.scale,
            e.clientY / clickDropVariables.scale,
            clickDropVariables.scale);

        clickDropVariables.things.push(newThing);
        var vx = randInt(-100, 100) * 10 / clickDropVariables.scale;
        var vy = randInt(-500, -100) * 10 / clickDropVariables.scale;
        newThing.body.ApplyImpulse(new b2Vec2(vx, vy), newThing.body.GetWorldCenter());
        newThing.body.ApplyTorque(randInt(-700, 700));
    }
    window.onresize = function () {
        clickDropVariables.canvas.width = window.innerWidth;
        clickDropVariables.canvas.height = window.innerHeight;
    };
    window.onresize();
    world = new b2World(new b2Vec2(0, 40), true);

    function clickDropUpdate() {

        clickDropVariables.things = clickDropVariables.things.filter(function (t) {
            return t.stillIn(clickDropVariables.canvas, clickDropVariables.scale);
        });
        if (clickDropVariables.things.length > 0) {
            //clickDropVariables.ctx.clearRect(0, 0, clickDropVariables.canvas.width, clickDropVariables.canvas.height);

            var x0 = clickDropVariables.things.map(function (t) {
                return t.leftBoundDistance(clickDropVariables.scale);
            }).sort(function (a, b) {
                return a - b;
            })[0];
            var x1 = clickDropVariables.things.map(function (t) {
                return t.rightBoundDistance(clickDropVariables.scale);
            }).sort(function (a, b) {
                return b - a;
            })[0];
            var y0 = clickDropVariables.things.map(function (t) {
                return t.topBoundDistance(clickDropVariables.scale);
            }).sort(function (a, b) {
                return a - b;
            })[0];
            var y1 = clickDropVariables.things.map(function (t) {
                return t.bottomBoundDistance(clickDropVariables.scale);
            }).sort(function (a, b) {
                return b - a;
            })[0];
            clickDropVariables.ctx.clearRect(x0, y0, fastAbs(x1 - x0), fastAbs(y1 - y0));
            // clickDropVariables.things.forEach(function (thing) {
            //     thing.clear(clickDropVariables.ctx, clickDropVariables.scale);
            // });
        }

        clickDropVariables.things.forEach(function (thing) {
            thing.render(clickDropVariables.ctx, clickDropVariables.scale);
        });

        world.Step(1 / 60, 10, 10);
        world.ClearForces();
        requestAnimationFrame(clickDropUpdate);
    }
    clickDropUpdate();
}