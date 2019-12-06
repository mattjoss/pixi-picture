	
/// <reference path="PictureShader.ts" />

namespace pixi_picture {
	const overlayFrag = `
varying vec2 vTextureCoord;
varying vec2 vMapCoord;
varying vec4 vColor;

uniform sampler2D uSampler[2];
uniform vec4 uColor;
%SPRITE_UNIFORMS%

// Functions from https://drafts.fxtf.org/compositing/#blendingcolor
float Lum(vec3 C) {
	float lum = 0.3 * C.r + 0.59 * C.g + 0.11 * C.b;
	return lum;
}


vec3 ClipColor(vec3 C) {
	float L = Lum(C);
	float n = min(C.r, min(C.g, C.b));
	float x = max(C.r, max(C.g, C.b));
	if (n < 0.0) {
		C = L + (((C - L) * L) / (L - n));
	}
	if(x > 1.0) {
		C = L + (((C - L) * (1.0 - L)) / (x - L));
	}
	return C;
}

vec3 SetLum(vec3 C, float l) {
	float d = l - Lum(C);
	C.r = C.r + d;
	C.g = C.g + d;
	C.b = C.b + d;
	return ClipColor(C);
}
	

void main(void)
{
    %SPRITE_CODE%
    vec4 source = texture2D(uSampler[0], textureCoord) * uColor;
    vec4 target = texture2D(uSampler[1], vMapCoord);

    //reverse hardlight
    if (source.a == 0.0) {
        gl_FragColor = vec4(0, 0, 0, 0);
        return;
    }
    //yeah, premultiplied
    vec3 Cb = source.rgb/source.a, Cs;
    if (target.a > 0.0) {
        Cs = target.rgb / target.a;
	}
	
	// Formula from https://drafts.fxtf.org/compositing/#blendingcolor
	// SetLum(Cs, Lum(Cb))

	vec3 Cm = SetLum(Cs, Lum(Cb));

	
    vec4 res;
    res.xyz = (1.0 - source.a) * Cs + source.a * Cm;
    res.a = source.a + target.a * (1.0-source.a);
    gl_FragColor = vec4(res.xyz * res.a, res.a);
}
`;

    /**
     * @class
     * @extends PIXI.Shader
     * @memberof PIXI.extras
     * @param gl {PIXI.Shader} The WebGL shader manager this shader works for.
     * @param tilingMode {number} 0 for default, 1 for simple tiling, 2 for tiling
     */
    export class ColorShader extends PictureShader {
        constructor(gl: WebGLRenderingContext, tilingMode: number) {
            super(gl, PictureShader.blendVert, overlayFrag, tilingMode);
        }
    }
}


