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
        // image.ctx.fillStyle = "#FF0000";
        // image.ctx.fillRect(0, 0, image.canvas.width, image.canvas.height);
        //image.ctx.restore();
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
}

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
        newThing.body.ApplyTorque(randInt(-500, 500));
    }
    window.onresize = function () {
        clickDropVariables.canvas.width = window.innerWidth;
        clickDropVariables.canvas.height = window.innerHeight;
    };
    window.onresize();
    world = new b2World(new b2Vec2(0, 40), true);
    window.setInterval(function () {
        clickDropVariables.ctx.clearRect(0, 0, clickDropVariables.canvas.width, clickDropVariables.canvas.height);
        world.Step(1 / 60, 10, 10);
        clickDropVariables.things.forEach(function (thing) {
            thing.render(clickDropVariables.ctx, clickDropVariables.scale);
        });
        world.ClearForces();
    }, 1000 / 60);
}