import React, { useRef, useEffect } from 'react';

const vertShaderSource = `
    precision mediump float;

    varying vec2 vUv;
    attribute vec2 a_position;

    void main() {
        vUv = .5 * (a_position + 1.);
        gl_Position = vec4(a_position, 0.0, 1.0);
    }
`;

const fragShaderSource = `
    precision mediump float;

    varying vec2 vUv;
    uniform float u_time;
    uniform float u_ratio;
    uniform vec2 u_pointer_position;
    uniform float u_scroll_progress;

    vec2 rotate(vec2 uv, float th) {
        return mat2(cos(th), sin(th), -sin(th), cos(th)) * uv;
    }

    float neuro_shape(vec2 uv, float t, float p) {
        vec2 sine_acc = vec2(0.);
        vec2 res = vec2(0.);
        float scale = 8.;

        for (int j = 0; j < 15; j++) {
            uv = rotate(uv, 1.);
            sine_acc = rotate(sine_acc, 1.);
            vec2 layer = uv * scale + float(j) + sine_acc - t;
            sine_acc += sin(layer);
            res += (.5 + .5 * cos(layer)) / scale;
            scale *= (1.2 - .2 * p);
        }
        return res.x + res.y;
    }

    void main() {
        // UV and pointer setup from original, for consistency
        vec2 base_uv = .5 * vUv;
        base_uv.x *= u_ratio;
        
        vec2 pointer = vUv - u_pointer_position;
        pointer.x *= u_ratio;
        
        // p is strongest at pointer, fades out
        float p = clamp(length(pointer), 0., 1.);
        p = .5 * pow(1. - p, 2.);
        
        float t = .001 * u_time;
        
        // --- Layers for 3D Parallax Effect ---
        
        // Background Layer (subtle movement, larger features)
        // We apply parallax shift to the texture coordinates.
        // The shift is proportional to the pointer's distance from center.
        vec2 pointer_from_center = u_pointer_position - 0.5;
        vec2 uv_bg = base_uv - pointer_from_center * 0.05; 
        float noise_bg = neuro_shape(uv_bg, t * 0.9, p);
        noise_bg = pow(noise_bg, 3.0) * 0.9;
        
        // Foreground Layer (more movement, smaller features)
        vec2 uv_fg = base_uv - pointer_from_center * 0.15;
        float noise_fg = neuro_shape(uv_fg, t, p);
        noise_fg = 1.2 * pow(noise_fg, 3.) + pow(noise_fg, 10.);

        // Combine noise, processing it to get final visibility
        float combined_noise = noise_bg * 0.4 + noise_fg * 0.6;
        combined_noise = max(.0, combined_noise - .5);

        // --- Color Integration ---
        // Colors inspired by HeroBackground gradient and neon filter
        vec3 color_dark_purple = vec3(0.16, 0.10, 0.31); // ~ #2a1a4f
        vec3 color_bright_cyan = vec3(0.0, 0.94, 1.0);   // ~ #00f0ff
        
        // Blend colors based on noise intensity
        vec3 final_color = mix(color_dark_purple, color_bright_cyan, smoothstep(0.0, 0.5, combined_noise));

        // Final color is modulated by noise
        final_color *= combined_noise;

        // Vignette to blend edges into the background
        float vignette = 1.0 - length(vUv - 0.5) * 1.2;
        final_color *= vignette;
        float final_alpha = combined_noise * vignette;
        
        gl_FragColor = vec4(final_color, final_alpha);
    }
`;

const NeuralBackground: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const pointerRef = useRef({ x: 0, y: 0, tX: 0, tY: 0 });
    const animationFrameIdRef = useRef<number>(0);
    const uniformsRef = useRef<{ [key: string]: WebGLUniformLocation | null }>({});

    useEffect(() => {
        const canvasEl = canvasRef.current;
        if (!canvasEl) return;
        
        // Center the pointer initially
        pointerRef.current.tX = window.innerWidth / 2;
        pointerRef.current.tY = window.innerHeight / 2;
        pointerRef.current.x = window.innerWidth / 2;
        pointerRef.current.y = window.innerHeight / 2;

        const devicePixelRatio = Math.min(window.devicePixelRatio, 2);

        // Fix: Add type assertion to ensure `gl` is treated as `WebGLRenderingContext`.
        const gl = (canvasEl.getContext("webgl") || canvasEl.getContext("experimental-webgl")) as WebGLRenderingContext;

        if (!gl) {
            console.error("WebGL is not supported by your browser.");
            return;
        }

        const createShader = (gl: WebGLRenderingContext, sourceCode: string, type: number) => {
            const shader = gl.createShader(type);
            if (!shader) return null;
            gl.shaderSource(shader, sourceCode);
            gl.compileShader(shader);

            if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                console.error("An error occurred compiling the shaders: " + gl.getShaderInfoLog(shader));
                gl.deleteShader(shader);
                return null;
            }

            return shader;
        };

        const vertexShader = createShader(gl, vertShaderSource, gl.VERTEX_SHADER);
        const fragmentShader = createShader(gl, fragShaderSource, gl.FRAGMENT_SHADER);

        if (!vertexShader || !fragmentShader) return;

        const createShaderProgram = (gl: WebGLRenderingContext, vertexShader: WebGLShader, fragmentShader: WebGLShader) => {
            const program = gl.createProgram();
            if (!program) return null;
            gl.attachShader(program, vertexShader);
            gl.attachShader(program, fragmentShader);
            gl.linkProgram(program);

            if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
                console.error("Unable to initialize the shader program: " + gl.getProgramInfoLog(program));
                return null;
            }

            return program;
        };

        const shaderProgram = createShaderProgram(gl, vertexShader, fragmentShader);
        if (!shaderProgram) return;

        const getUniforms = (program: WebGLProgram) => {
            let uniforms: { [key: string]: WebGLUniformLocation | null } = {};
            let uniformCount = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
            for (let i = 0; i < uniformCount; i++) {
                const uniformInfo = gl.getActiveUniform(program, i);
                if (uniformInfo) {
                    const uniformName = uniformInfo.name;
                    uniforms[uniformName] = gl.getUniformLocation(program, uniformName);
                }
            }
            return uniforms;
        };

        uniformsRef.current = getUniforms(shaderProgram);

        const vertices = new Float32Array([-1., -1., 1., -1., -1., 1., 1., 1.]);

        const vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

        gl.useProgram(shaderProgram);

        const positionLocation = gl.getAttribLocation(shaderProgram, "a_position");
        gl.enableVertexAttribArray(positionLocation);

        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

        const updateMousePosition = (eX: number, eY: number) => {
            pointerRef.current.tX = eX;
            pointerRef.current.tY = eY;
        };
        
        const handlePointerMove = (e: PointerEvent) => updateMousePosition(e.clientX, e.clientY);
        const handleTouchMove = (e: TouchEvent) => updateMousePosition(e.targetTouches[0].clientX, e.targetTouches[0].clientY);
        
        const setupEvents = () => {
            window.addEventListener("pointermove", handlePointerMove);
            window.addEventListener("touchmove", handleTouchMove);
        };
        
        const removeEvents = () => {
            window.removeEventListener("pointermove", handlePointerMove);
            window.removeEventListener("touchmove", handleTouchMove);
        }

        const resizeCanvas = () => {
            canvasEl.width = window.innerWidth * devicePixelRatio;
            canvasEl.height = window.innerHeight * devicePixelRatio;
            gl.uniform1f(uniformsRef.current.u_ratio, canvasEl.width / canvasEl.height);
            gl.viewport(0, 0, canvasEl.width, canvasEl.height);
        };

        const render = (currentTime: number) => {
            pointerRef.current.x += (pointerRef.current.tX - pointerRef.current.x) * .05;
            pointerRef.current.y += (pointerRef.current.tY - pointerRef.current.y) * .05;

            gl.uniform1f(uniformsRef.current.u_time, currentTime);
            gl.uniform2f(uniformsRef.current.u_pointer_position, pointerRef.current.x / window.innerWidth, 1 - pointerRef.current.y / window.innerHeight);
            gl.uniform1f(uniformsRef.current.u_scroll_progress, window.pageYOffset / (2 * window.innerHeight));

            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
            animationFrameIdRef.current = requestAnimationFrame(render);
        };
        
        setupEvents();
        resizeCanvas();
        window.addEventListener("resize", resizeCanvas);
        animationFrameIdRef.current = requestAnimationFrame(render);

        return () => {
            window.removeEventListener("resize", resizeCanvas);
            removeEvents();
            cancelAnimationFrame(animationFrameIdRef.current);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                pointerEvents: 'none',
                opacity: 0.95,
                zIndex: 1,
            }}
        />
    );
};

export default NeuralBackground;