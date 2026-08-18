// Shader matrices
// --- Pre-calculated Transformation Matrices ---

// Transformation Matrices for Pre-computed Colour Blindness Transformations
// link: https://www.inf.ufrgs.br/%7Eoliveira/pubs_files/CVD_Simulation/CVD_Simulation.html
// Citation: Gustavo M. Machado, Manuel M. Oliveira, and Leandro A. F. Fernandes "A Physiologically-based Model for Simulation of Color Vision Deficiency". IEEE Transactions on Visualization and Computer Graphics. Volume 15 (2009), Number 6, November/December 2009. pp. 1291-1298.

// Key: Severity 0.0 to 1.0
// Value: Corresponding Matrix

const PROTAN_MATRIX = {
    "0.0": [1,	        0,          -0,           0,        1,          0,           -0,        -0,         1       ],
    "0.1": [0.856167,   0.182038,   -0.038205,    0.029342,	0.955115,   0.015544,    -0.002880, -0.001563,  1.004443],
    "0.2": [0.734766,   0.334872,   -0.069637,    0.051840,	0.919198,   0.028963,    -0.004928, -0.004209,  1.009137],
    "0.3": [0.630323,   0.465641,   -0.095964,    0.069181,	0.890046,   0.040773,    -0.006308, -0.007724,  1.014032],
    "0.4": [0.539009,   0.579343,   -0.118352,    0.082546,	0.866121,   0.051332,    -0.007136, -0.011959,  1.019095],
    "0.5": [0.458064,   0.679578,   -0.137642,    0.092785,	0.846313,   0.060902,    -0.007494, -0.016807,  1.024301],
    "0.6": [0.385450,   0.769005,   -0.154455,    0.100526,	0.829802,   0.069673,    -0.007442, -0.022190,  1.029632],
    "0.7": [0.319627,   0.849633,   -0.169261,    0.106241,	0.815969,   0.077790,    -0.007025, -0.028051,  1.035076],
    "0.8": [0.259411,   0.923008,   -0.182420,    0.110296,	0.804340,   0.085364,    -0.006276, -0.034346,  1.040622],
    "0.9": [0.203876,   0.990338,   -0.194214,    0.112975,	0.794542,   0.092483,    -0.005222, -0.041043,  1.046265],
    "1.0": [0.152286,   1.052583,   -0.204868,    0.114503,	0.786281,   0.099216,    -0.003882, -0.048116,  1.051998]
}

const DEUTERAN_MATRIX = {
    "0.0": [1,          0,          -0,           0,        1,          0,           -0,        -0,         1       ],
    "0.1": [0.866435,   0.177704,   -0.044139,    0.049567, 0.939063,   0.011370,    -0.003453,	0.007233,   0.996220],
    "0.2": [0.760729,   0.319078,   -0.079807,    0.090568, 0.889315,   0.020117,    -0.006027,	0.013325,   0.992702],
    "0.3": [0.675425,   0.433850,   -0.109275,    0.125303, 0.847755,   0.026942,    -0.007950,	0.018572,   0.989378],
    "0.4": [0.605511,   0.528560,   -0.134071,    0.155318, 0.812366,   0.032316,    -0.009376,	0.023176,   0.986200],
    "0.5": [0.547494,   0.607765,   -0.155259,    0.181692, 0.781742,   0.036566,    -0.010410,	0.027275,   0.983136],
    "0.6": [0.498864,   0.674741,   -0.173604,    0.205199, 0.754872,   0.039929,    -0.011131,	0.030969,   0.980162],
    "0.7": [0.457771,   0.731899,   -0.189670,    0.226409, 0.731012,   0.042579,    -0.011595,	0.034333,   0.977261],
    "0.8": [0.422823,   0.781057,   -0.203881,    0.245752, 0.709602,   0.044646,    -0.011843,	0.037423,   0.974421],
    "0.9": [0.392952,   0.823610,   -0.216562,    0.263559, 0.690210,   0.046232,    -0.011910,	0.040281,   0.971630],
    "1.0": [0.367322,   0.860646,   -0.227968,    0.280085, 0.672501,   0.047413,    -0.011820,	0.042940,   0.968881]
}

const TRITAN_MATRIX = {
    "0.0": [1,	        0,          -0,           0,            1,          0,           -0,        -0,	        1       ],
    "0.1": [0.926670,   0.092514,   -0.019184,    0.021191,	    0.964503,   0.014306,    0.008437,  0.054813,   0.936750],
    "0.2": [0.895720,   0.133330,   -0.029050,    0.029997,	    0.945400,   0.024603,    0.013027,  0.104707,   0.882266],
    "0.3": [0.905871,   0.127791,   -0.033662,    0.026856,	    0.941251,   0.031893,    0.013410,  0.148296,   0.838294],
    "0.4": [0.948035,   0.089490,   -0.037526,    0.014364,	    0.946792,   0.038844,    0.010853,  0.193991,   0.795156],
    "0.5": [1.017277,   0.027029,   -0.044306,    -0.006113,    0.958479,   0.047634,    0.006379,  0.248708,   0.744913],
    "0.6": [1.104996,   -0.046633,  -0.058363,    -0.032137,    0.971635,   0.060503,    0.001336,  0.317922,   0.680742],
    "0.7": [1.193214,   -0.109812,  -0.083402,    -0.058496,    0.979410,   0.079086,    -0.002346, 0.403492,   0.598854],
    "0.8": [1.257728,   -0.139648,  -0.118081,    -0.078003,    0.975409,   0.102594,    -0.003316, 0.501214,   0.502102],
    "0.9": [1.278864,   -0.125333,  -0.153531,    -0.084748,    0.957674,   0.127074,    -0.000989, 0.601151,   0.399838],
    "1.0": [1.255528,   -0.076749,  -0.178779,    -0.078411,    0.930809,   0.147602,    0.004733,  0.691367,   0.303900]
}

const ColourShader = {
    NONE: "NONE",
    
    ACHROMATOPSIA: "ACHROMATOPSIA",
    MONOCHROMACY: "MONOCHROMACY",
    
    TRITANOPIA: "TRITANOPIA",
    TRITANOMALY: "TRITANOMALY",
    
    PROTANOPIA: "PROTANOPIA",
    PROTANOMALY: "PROTANOMALY",
    
    DEUTERANOPIA: "DEUTERANOPIA",
    DEUTERANOMALY: "DEUTERANOMALY",
};


// Finds matching Severity Matrix, or if the value doesn't exist (and is between 0.0 and 1.0), returns an interpolated value Matrix.
function getSeverityMatrix(severityMatrix, severity) {
    const try_parse_float = parseFloat(severity);
    const key_float = try_parse_float.toFixed(1);
    
    if (severityMatrix[key_float] !== undefined) {
        return severityMatrix[key_float];
    }
    
    // Check if value is valid float 0.0 to 1.0
    // if so, create and return lerp_matrix_out
    else if (0.0 < try_parse_float && 1.0 > try_parse_float) {
        const lerp_matrix_out = [
            0, 0, 0,
            0, 0, 0,
            0, 0, 0
        ];
        
        // lerp the prev_index of try_parse_float with the next_index of try_parse_float
        //   with a weight of try_parse_float - prev_index
        //  (e.g. 0.87 is prev_index[0.8] lerped with next_index[0.9], with weight[0.87 - 0.8])
        
        const prev_index = Math.floor(try_parse_float * 10) / 10;
        const next_index = Math.ceil(try_parse_float * 10) / 10;
        const weight = try_parse_float - prev_index;
        
        const prev_matrix = severityMatrix[prev_index];
        const next_matrix = severityMatrix[next_index];
        
        for (let i = 0; i < lerp_matrix_out.length; ++i) {
            lerp_matrix_out[i] = prev_matrix[i] + (next_matrix[i] - prev_matrix[i]) * weight;
        }
        
        return lerp_matrix_out;
    }
    
    // Invalid value
    else {
        console.warn("Invalid getSeverityMatrix lerp value: [" + try_parse_float + "]");
        return null;
    }
}


// For Colour Vision Deficiency of the Protan-, Deuteran-, Tritan- types
function buildMatrixMultiplyGLSL(matrix) {
    return `
        vec4 colour = texture2D(tex0, vTexCoord);
        vec3 row0 = vec3(${matrix[0]}, ${matrix[1]}, ${matrix[2]});
        vec3 row1 = vec3(${matrix[3]}, ${matrix[4]}, ${matrix[5]});
        vec3 row2 = vec3(${matrix[6]}, ${matrix[7]}, ${matrix[8]});
        float outR = dot(colour.rgb, row0);
        float outG = dot(colour.rgb, row1);
        float outB = dot(colour.rgb, row2);
        gl_FragColor = vec4(outR, outG, outB, colour.a);
    `;
}


// For Colour Vision Deficiency of Achromatopsia and Monochromacy
// RGB Weights from Rec. 709 https://en.wikipedia.org/wiki/Rec._709#:~:text=0.2126%2C%200.7152%2C%20and%200.0722
function buildLuminanceGLSL(severity) {
    const severity_float = parseFloat(severity).toFixed(6);
    return `
        vec4 colour = texture2D(tex0, vTexCoord);
        vec3 rgb_weights = vec3(0.2126, 0.7152, 0.0722);
        float grey = dot(colour.rgb, rgb_weights);
        vec3 result = mix(colour.rgb, vec3(grey), ${severity_float});
        gl_FragColor = vec4(result, colour.a);
    `;
}


function generateGLSLShader(selectedFilter=null, severity="1.0") {
    let shaderCode = `
        precision highp float;
        varying vec2 vTexCoord;
        uniform sampler2D tex0;

        void main() {
    `;
    
    switch(selectedFilter) {
        case ColourShader.NONE:
            shaderCode += `
                vec4 colour = texture2D(tex0, vTexCoord);
                gl_FragColor = vec4(colour.r, colour.g, colour.b, colour.a);
            `;
            break;
        
        case ColourShader.ACHROMATOPSIA:
            shaderCode += buildLuminanceGLSL(severity);
            break;
        
        case ColourShader.PROTANOPIA:
            shaderCode += buildMatrixMultiplyGLSL(
                getSeverityMatrix(PROTAN_MATRIX, severity)
            );
            break;
        
        case ColourShader.DEUTERANOPIA:
            shaderCode += buildMatrixMultiplyGLSL(
                getSeverityMatrix(DEUTERAN_MATRIX, severity)
            );
            break;
        
        case ColourShader.TRITANOPIA:
            shaderCode += buildMatrixMultiplyGLSL(
                getSeverityMatrix(TRITAN_MATRIX, severity)
            );
            break;
        
        default:
            console.warn("Unknown shader filter: ", selectedFilter);
            shaderCode += `
                vec4 colour = texture2D(tex0, vTexCoord);
                gl_FragColor = colour;
            `;
            break;
    }
    
    shaderCode = shaderCode + `}`;
    return shaderCode;
}


function applyImageShader(view) {
    // generate shader
    const fragmentSrc = generateGLSLShader( view.shaderType, view.severity );
    view.sandbox.load(fragmentSrc);
}


function applyVideoFrameShader(view) {
    // upload current video frarme
    const gl = view.gl;
    gl.bindTexture(gl.TEXTURE_2D, view.texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, view.video);

    // generate shader
    const fragmentSrc = generateGLSLShader( view.shaderType, view.severity );
    const program = createProgram(gl, VERTEX_SHADER_SRC, fragmentSrc);

    gl.useProgram(program);

    // bind quad geometry
    if (!view.quadBuffer) view.quadBuffer = createQuadBuffers(gl);
    gl.bindBuffer(gl.ARRAY_BUFFER, view.quadBuffer);

    const aPosition = gl.getAttribLocation(program, "aPosition");
    const aTexCoord = gl.getAttribLocation(program, "aTexCoord");

    gl.enableVertexAttribArray(aPosition);
    gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 16, 0);

    gl.enableVertexAttribArray(aTexCoord);
    gl.vertexAttribPointer(aTexCoord, 2, gl.FLOAT, false, 16, 8);

    // bind sampler
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, view.texture);
    gl.uniform1i(gl.getUniformLocation(program, "tex0"), 0);

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    view.program = program;
}