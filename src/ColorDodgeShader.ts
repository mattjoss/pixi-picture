	
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

    if (source.a == 0.0) {
        gl_FragColor = vec4(0, 0, 0, 0);
        return;
    }
    //yeah, premultiplied
    vec3 Cs = source.rgb/source.a, Cb;
    if (target.a > 0.0) {
        Cb = target.rgb / target.a;
	}
	
	// Formula from https://drafts.fxtf.org/compositing/#blendingcolor
	// if(Cb == 0)
	//     B(Cb, Cs) = 0
	// else if(Cs == 1)
	//     B(Cb, Cs) = 1
	// else
	// 	B(Cb, Cs) = min(1.0, Cb / (1.0 - Cs))


	vec3 Cm;

	// Can these be combined?
	// red
	if (Cb.r == 0.0) {
		Cm.r = 0.0;
	} else if (Cs.r == 1.0) {
		Cm.r = 1.0;
	} else {
		Cm.r = min(1.0, Cb.r / (1.0-Cs.r));
	}

	// green
	if (Cb.g == 0.0) {
		Cm.g = 0.0;
	} else if (Cs.g == 1.0) {
		Cm.g = 1.0;
	} else {
		Cm.g = min(1.0, Cb.g / (1.0-Cs.g));
	}

	//blue
	if (Cb.b == 0.0) {
		Cm.b = 0.0;
	} else if (Cs.b == 1.0) {
		Cm.b = 1.0;
	} else {
		Cm.b = min(1.0, Cb.b / (1.0-Cs.b));
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
    export class ColorDodgeShader extends PictureShader {
        constructor(gl: WebGLRenderingContext, tilingMode: number) {
            super(gl, PictureShader.blendVert, overlayFrag, tilingMode);
        }
    }
}
