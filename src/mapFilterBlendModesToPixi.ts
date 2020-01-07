namespace pixi_picture {
    export function mapFilterBlendModesToPixi(gl: WebGLRenderingContext, array: Array<Array<PictureShader>> = []): Array<Array<PictureShader>>
    {
        PIXI.BLEND_MODES.LINEAR_DODGE = 20;
        PIXI.BLEND_MODES.LINEAR_BURN = 21;
        PIXI.BLEND_MODES.LINEAR_LIGHT = 22;

        //TODO - premultiply alpha would be different.
        //add a boolean for that!
        array[PIXI.BLEND_MODES.OVERLAY] = [new OverlayShader(gl, 0), new OverlayShader(gl, 1), new OverlayShader(gl, 2)];
        array[PIXI.BLEND_MODES.HARD_LIGHT] = [new HardLightShader(gl, 0), new HardLightShader(gl, 1), new HardLightShader(gl, 2)];
	    array[PIXI.BLEND_MODES.SOFT_LIGHT] = [new SoftLightShader(gl, 0), new SoftLightShader(gl, 1), new SoftLightShader(gl, 2)];
	    array[PIXI.BLEND_MODES.DARKEN] = [new DarkenShader(gl, 0), new DarkenShader(gl, 1), new DarkenShader(gl, 2)];
	    array[PIXI.BLEND_MODES.LIGHTEN] = [new LightenShader(gl, 0), new LightenShader(gl, 1), new LightenShader(gl, 2)];
	    array[PIXI.BLEND_MODES.COLOR_DODGE] = [new ColorDodgeShader(gl, 0), new ColorDodgeShader(gl, 1), new ColorDodgeShader(gl, 2)];
	    array[PIXI.BLEND_MODES.COLOR_BURN] = [new ColorBurnShader(gl, 0), new ColorBurnShader(gl, 1), new ColorBurnShader(gl, 2)];
        array[PIXI.BLEND_MODES.COLOR] = [new ColorShader(gl, 0), new ColorBurnShader(gl, 1), new ColorBurnShader(gl, 2)];
	    array[PIXI.BLEND_MODES.LUMINOSITY] = [new LuminosityShader(gl, 0), new LuminosityShader(gl, 1), new LuminosityShader(gl, 2)];

        array[PIXI.BLEND_MODES.LINEAR_DODGE] = [new LinearDodgeShader(gl, 0), new LinearDodgeShader(gl, 1), new LinearDodgeShader(gl, 2)];
	    array[PIXI.BLEND_MODES.LINEAR_BURN] = [new LinearBurnShader(gl, 0), new LinearBurnShader(gl, 1), new LinearBurnShader(gl, 2)];
	    array[PIXI.BLEND_MODES.LINEAR_LIGHT] = [new LinearLightShader(gl, 0), new LinearLightShader(gl, 1), new LinearLightShader(gl, 2)];

	    array[PIXI.BLEND_MODES.HUE] = [new HueShader(gl, 0), new HueShader(gl, 1), new HueShader(gl, 2)];
	    array[PIXI.BLEND_MODES.SATURATION] = [new SaturationShader(gl, 0), new SaturationShader(gl, 1), new SaturationShader(gl, 2)];
	    array[PIXI.BLEND_MODES.DIFFERENCE] = [new DifferenceShader(gl, 0), new DifferenceShader(gl, 1), new DifferenceShader(gl, 2)];

        return array;
    }
}
