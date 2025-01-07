// Initialize Matter.js
const Engine = Matter.Engine,
  Render = Matter.Render,
  Runner = Matter.Runner,
  Bodies = Matter.Bodies,
  Composite = Matter.Composite,
  Mouse = Matter.Mouse,
  MouseConstraint = Matter.MouseConstraint;

// Create engine
const engine = Engine.create();

// Create renderer
const render = Render.create({
  element: document.querySelector(".shapes"),
  engine: engine,
  options: {
    width: window.innerWidth,
    height: window.innerHeight,
    wireframes: false,
    background: "transparent",
  },
});

// Create ground and walls
const ground = Bodies.rectangle(
  window.innerWidth / 2,
  window.innerHeight + 30,
  window.innerWidth,
  60,
  {
    isStatic: true,
    render: {
      fillStyle: "transparent",
    },
  }
);

const leftWall = Bodies.rectangle(
  -30,
  window.innerHeight / 2,
  60,
  window.innerHeight,
  {
    isStatic: true,
    render: {
      fillStyle: "transparent",
    },
  }
);

const rightWall = Bodies.rectangle(
  window.innerWidth + 30,
  window.innerHeight / 2,
  60,
  window.innerHeight,
  {
    isStatic: true,
    render: {
      fillStyle: "transparent",
    },
  }
);

// Add ground and walls to the world
Composite.add(engine.world, [ground, leftWall, rightWall]);

// Add mouse control
const mouse = Mouse.create(render.canvas);
const mouseConstraint = MouseConstraint.create(engine, {
  mouse: mouse,
  constraint: {
    stiffness: 0.2,
    render: {
      visible: false,
    },
  },
});

Composite.add(engine.world, mouseConstraint);
render.mouse = mouse;

// Create array of textures
// Define size for both shapes and textures
const SHAPE_SIZE = 50;

// Create array of textures with your local image paths
const textures = [
  "/Assets/blocks/block 1.png",
  "/Assets/blocks/block 2.png",
  "/Assets/blocks/block 3.png",
  "/Assets/blocks/block 4.png",
].map((src) => {
  const img = new Image();
  img.src = src;
  img.width = SHAPE_SIZE;
  img.height = SHAPE_SIZE;
  return img;
});

// Click event to add shapes
document.addEventListener("click", (event) => {
  // Don't create shapes if clicking on menu or other interactive elements
  if (
    event.target.closest("menu") ||
    event.target.closest("a") ||
    event.target.closest("button") ||
    event.target.closest("footer")
  ) {
    return;
  }

  // Use the constant SHAPE_SIZE defined above
  const randomTexture = textures[Math.floor(Math.random() * textures.length)];

  const shape = Bodies.rectangle(
    event.clientX,
    event.clientY,
    SHAPE_SIZE,
    SHAPE_SIZE,
    {
      render: {
        sprite: {
          texture: randomTexture.src,
          xScale: 1,
          yScale: 1,
        },
      },
      restitution: 0.5,
      friction: 0.1,
      density: 0.001,
    }
  );

  Composite.add(engine.world, shape);
});

// Handle window resize
window.addEventListener("resize", () => {
  render.canvas.width = window.innerWidth;
  render.canvas.height = window.innerHeight;

  // Update ground and walls
  Matter.Body.setPosition(ground, {
    x: window.innerWidth / 2,
    y: window.innerHeight + 30,
  });
  Matter.Body.setPosition(rightWall, {
    x: window.innerWidth + 30,
    y: window.innerHeight / 2,
  });

  // Update ground size
  Matter.Body.setVertices(
    ground,
    Bodies.rectangle(
      window.innerWidth / 2,
      window.innerHeight + 30,
      window.innerWidth,
      60
    ).vertices
  );
});

// Run the engine and renderer
Runner.run(engine);
Render.run(render);
