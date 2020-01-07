	
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

float Sat(vec3 C) {
	return (max(C.r, max(C.g, C.b)) - min(C.r, min(C.g, C.b)));
}

// Find middle number of 3 numbers
float middleOfThree(float a, float b, float c)
{
    if (a > b)
    {
		if (b > c) {
            return b;
		} else if (a > c) {
            return c;
		} else {
            return a;
		}
    }
    else
    {
		if (a > c) {
            return a;
		} else if (b > c) {
            return c;
		} else {
            return b;
		}
    }
}

vec3 SetSat(vec3 C, float s) {
	float Cmax = max(C.r, max(C.g, C.b));
	float Cmin = min(C.r, min(C.g, C.b));
	float Cmid = middleOfThree(C.r, C.g, C.b);

	int minIndex, midIndex, maxIndex;

	if (Cmax > Cmin) {
		Cmid = (((Cmid - Cmin) * s) / (Cmax - Cmin));
		Cmax = s;
	} else {
		Cmid = Cmax = 0.0;
	}
	Cmin = 0.0;

	if (C.r < C.g) {
		if (C.r < C.b) {
			C.r = Cmin;
			if (C.g > C.b) {
				C.g = Cmax;
				C.b = Cmid;
			} else {
				C.g = Cmid;
				C.b = Cmax;
			}
		} else {
			C.r = Cmid;
			if (C.g < C.b) {
				C.g = Cmin;
				C.b = Cmax;
			} else {
				C.g = Cmax;
				C.b = Cmin;
			}
		}
	} else {
		if (C.r < C.b) {
			C.r = Cmid;
			C.g = Cmin;
			C.b = Cmax;
		} else {
			if (C.g > C.b) {
				C.g = Cmid;
				C.b = Cmin;
			} else {
				C.g = Cmin;
				C.b = Cmid;
			}
			C.r = Cmax;
		}
	}

	return C;
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
    vec3 Cs = source.rgb/source.a, Cb;
    if (target.a > 0.0) {
        Cb = target.rgb / target.a;
	}
	
	// Formula from https://drafts.fxtf.org/compositing/#blendingcolor
	// B(Cb, Cs) = SetLum(SetSat(Cs, Sat(Cb)), Lum(Cb))

	vec3 Cm = SetLum(SetSat(Cs, Sat(Cb)), Lum(Cb));

	
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
    export class HueShader extends PictureShader {
        constructor(gl: WebGLRenderingContext, tilingMode: number) {
            super(gl, PictureShader.blendVert, overlayFrag, tilingMode);
        }
    }
}


