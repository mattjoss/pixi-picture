	
/// <reference path="PictureShader.ts" />

namespace pixi_picture {
	const overlayFrag = `
varying vec2 vTextureCoord;
varying vec2 vMapCoord;
varying vec4 vColor;

uniform sampler2D uSampler[2];
uniform vec4 uColor;
%SPRITE_UNIFORMS%

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
	// if(Cb == 1)
	//     B(Cb, Cs) = 1
	// else if(Cs == 0)
	//     B(Cb, Cs) = 0
	// else
	//     B(Cb, Cs) = 1 - min(1, (1 - Cb) / Cs)

	vec3 Cm;

	// Can these be combined?
	// red
	if (Cb.r == 1.0) {
		Cm.r = 1.0;
	} else if (Cs.r == 0.0) {
		Cm.r = 0.0;
	} else {
		Cm.r = 1.0 - min(1.0, (1.0 - Cb.r) / Cs.r);
	}

	// green
	if (Cb.g == 1.0) {
		Cm.g = 1.0;
	} else if (Cs.g == 0.0) {
		Cm.g = 0.0;
	} else {
		Cm.g = 1.0 - min(1.0, (1.0 - Cb.g) / Cs.g);
	}

	//blue
	if (Cb.b == 1.0) {
		Cm.b = 1.0;
	} else if (Cs.b == 0.0) {
		Cm.b = 0.0;
	} else {
		Cm.b = 1.0 - min(1.0, (1.0 - Cb.b) / Cs.b);
	}

	
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
    export class ColorBurnShader extends PictureShader {
        constructor(gl: WebGLRenderingContext, tilingMode: number) {
            super(gl, PictureShader.blendVert, overlayFrag, tilingMode);
        }
    }
}
