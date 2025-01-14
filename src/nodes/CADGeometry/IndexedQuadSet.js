/** @namespace x3dom.nodeTypes */
/*
 * X3DOM JavaScript Library
 * http://www.x3dom.org
 *
 * (C)2009 Fraunhofer IGD, Darmstadt, Germany
 * Dual licensed under the MIT and GPL
 */

// ### IndexedQuadSet ###
x3dom.registerNodeType(
    "IndexedQuadSet",
    "CADGeometry",
    defineClass( x3dom.nodeTypes.X3DComposedGeometryNode,

        /**
         * Constructor for IndexedQuadSet
         * @constructs x3dom.nodeTypes.IndexedQuadSet
         * @x3d 3.3
         * @component CADGeometry
         * @status experimental
         * @extends x3dom.nodeTypes.X3DComposedGeometryNode
         * @param {Object} [ctx=null] - context object, containing initial settings like namespace
         * @classdesc The IndexedQuadSet node represents a 3D shape composed of a collection of individual
         * quadrilaterals (quads).
         */
        function ( ctx )
        {
            x3dom.nodeTypes.IndexedQuadSet.superClass.call( this, ctx );

            /**
             * IndexedQuadSet uses the indices in its index field to specify the vertices of each
             * quad from the coord field.
             * @var {x3dom.fields.MFInt32} index
             * @memberof x3dom.nodeTypes.IndexedQuadSet
             * @initvalue []
             * @field x3d
             * @instance
             */
            this.addField_MFInt32( ctx, "index", [] );
        },
        {
            nodeChanged : function ()
            {
                /*
                 This code largely taken from the IndexedTriangleSet code
                 */
                var time0 = Date.now();

                this.handleAttribs();

                var colPerVert = this._vf.colorPerVertex;
                var normPerVert = this._vf.normalPerVertex;

                var indexes = this._vf.index;

                var hasNormal = false,
                    hasTexCoord = false,
                    hasColor = false;
                var positions,
                    normals,
                    texCoords,
                    colors;

                var coordNode = this._cf.coord.node;
                x3dom.debug.assert( coordNode );
                positions = coordNode._vf.point;

                var normalNode = this._cf.normal.node;
                if ( normalNode )
                {
                    hasNormal = true;
                    normals = normalNode._vf.vector;
                }
                else
                {
                    hasNormal = false;
                }

                var texMode = "",
                    numTexComponents = 2;
                var texCoordNode = this._cf.texCoord.node;
                if ( x3dom.isa( texCoordNode, x3dom.nodeTypes.MultiTextureCoordinate ) )
                {
                    if ( texCoordNode._cf.texCoord.nodes.length )
                    {texCoordNode = texCoordNode._cf.texCoord.nodes[ 0 ];}
                }
                if ( texCoordNode )
                {
                    if ( texCoordNode._vf.point )
                    {
                        hasTexCoord = true;
                        texCoords = texCoordNode._vf.point;

                        if ( x3dom.isa( texCoordNode, x3dom.nodeTypes.TextureCoordinate3D ) )
                        {
                            numTexComponents = 3;
                        }
                    }
                    else if ( texCoordNode._vf.mode )
                    {
                        texMode = texCoordNode._vf.mode;
                    }
                }
                else
                {
                    hasTexCoord = false;
                }

                var numColComponents = 3;
                var colorNode = this._cf.color.node;
                if ( colorNode )
                {
                    hasColor = true;
                    colors = colorNode._vf.color;

                    if ( x3dom.isa( colorNode, x3dom.nodeTypes.ColorRGBA ) )
                    {
                        numColComponents = 4;
                    }
                }
                else
                {
                    hasColor = false;
                }

                this._mesh._indices[ 0 ] = [];
                this._mesh._positions[ 0 ] = [];
                this._mesh._normals[ 0 ] = [];
                this._mesh._texCoords[ 0 ] = [];
                this._mesh._colors[ 0 ] = [];

                var i,
                    t,
                    cnt,
                    faceCnt,
                    posMax,
                    p0,
                    p1,
                    p2,
                    n0,
                    n1,
                    n2,
                    t0,
                    t1,
                    t2,
                    c0,
                    c1,
                    c2;

                // if positions array too short add degenerate triangle
                while ( positions.length % 4 > 0 )
                {
                    positions.push( positions.length - 1 );
                }
                posMax = positions.length;

                /*
                 Note: A separate section setting the _mesh field members
                 and starting with this test:
                 if (!normPerVert || positions.length > x3dom.Utils.maxIndexableCoords)
                 is in the IndexedTriangleSet code. It has been removed
                 here until it's applicability to the QUadSet case can
                 be evaluated

                 NOTE: !normPerVert or creaseAngle == 0 means per-face normals
                 therefore, the original multi-index structure also can't
                 be retained since this means every face has other vertices
                 with other attribute properties.
                 A similar problem arises if we have more than 2^16 coordinates
                 since WebGL only supports 16-bit indices, why we have to split
                 the mesh here (which is most easiest achieved by using just the
                 same code path previously mentioned)
                 */
                //if (true)
                {
                    faceCnt = 0;
                    for ( i = 0; i < indexes.length; i++ )
                    {
                        if ( ( i > 0 ) && ( i % 4 === 3 ) )
                        {
                            faceCnt++;

                            // then pushe the the 2nd triangle
                            // of the quad on
                            this._mesh._indices[ 0 ].push( indexes[ i - 3 ] );
                            this._mesh._indices[ 0 ].push( indexes[ i - 1 ] );
                            this._mesh._indices[ 0 ].push( indexes[ i ] );
                        }
                        else
                        {
                            this._mesh._indices[ 0 ].push( indexes[ i ] );
                        }

                        if ( !normPerVert && hasNormal )
                        {
                            this._mesh._normals[ 0 ].push( normals[ faceCnt ].x );
                            this._mesh._normals[ 0 ].push( normals[ faceCnt ].y );
                            this._mesh._normals[ 0 ].push( normals[ faceCnt ].z );
                        }
                        if ( !colPerVert && hasColor )
                        {
                            this._mesh._colors[ 0 ].push( colors[ faceCnt ].r );
                            this._mesh._colors[ 0 ].push( colors[ faceCnt ].g );
                            this._mesh._colors[ 0 ].push( colors[ faceCnt ].b );
                            if ( numColComponents === 4 )
                            {
                                this._mesh._colors[ 0 ].push( colors[ faceCnt ].a );
                            }
                        }
                    }

                    this._mesh._positions[ 0 ] = positions.toGL();

                    if ( hasNormal )
                    {
                        this._mesh._normals[ 0 ] = normals.toGL();
                    }
                    else
                    {
                        this._mesh.calcNormals( normPerVert ? Math.PI : 0 );
                    }

                    if ( hasTexCoord )
                    {
                        this._mesh._texCoords[ 0 ] = texCoords.toGL();
                        this._mesh._numTexComponents = numTexComponents;
                    }
                    else
                    {
                        this._mesh.calcTexCoords( texMode );
                    }

                    if ( hasColor && colPerVert )
                    {
                        this._mesh._colors[ 0 ] = colors.toGL();
                        this._mesh._numColComponents = numColComponents;
                    }
                }

                this.invalidateVolume();
                this._mesh._numFaces = 0;
                this._mesh._numCoords = 0;
                for ( i = 0; i < this._mesh._indices.length; i++ )
                {
                    this._mesh._numFaces += this._mesh._indices[ i ].length / 3;
                    this._mesh._numCoords += this._mesh._positions[ i ].length / 3;
                }

                var time1 = Date.now() - time0;
                //x3dom.debug.logInfo("Mesh load time: " + time1 + " ms");
            },

            fieldChanged : function ( fieldName )
            {
                var pnts = this._cf.coord.node._vf.point;

                if ( pnts.length > x3dom.Utils.maxIndexableCoords )  // are there other problematic cases?
                {
                    // TODO; implement
                    x3dom.debug.logWarning( "IndexedQuadSet: fieldChanged with " +
                        "too many coordinates not yet implemented!" );
                    return;
                }

                if ( fieldName == "coord" )
                {
                    this._mesh._positions[ 0 ] = pnts.toGL();

                    // tells the mesh that its bbox requires update
                    this.invalidateVolume();

                    this._parentNodes.forEach( function ( node )
                    {
                        node._dirty.positions = true;
                        node.invalidateVolume();
                    } );
                }
                else if ( fieldName == "color" )
                {
                    pnts = this._cf.color.node._vf.color;

                    if ( this._vf.colorPerVertex )
                    {
                        this._mesh._colors[ 0 ] = pnts.toGL();
                    }
                    else if ( !this._vf.colorPerVertex )
                    {
                        var faceCnt = 0;
                        var numColComponents = 3;
                        if ( x3dom.isa( this._cf.color.node, x3dom.nodeTypes.ColorRGBA ) )
                        {
                            numColComponents = 4;
                        }

                        this._mesh._colors[ 0 ] = [];

                        var i,
                            indexes = this._vf.index;
                        for ( i = 0; i < indexes.length; ++i )
                        {
                            if ( ( i > 0 ) && ( i % 3 === 0 ) )
                            {
                                faceCnt++;
                            }

                            this._mesh._colors[ 0 ].push( pnts[ faceCnt ].r );
                            this._mesh._colors[ 0 ].push( pnts[ faceCnt ].g );
                            this._mesh._colors[ 0 ].push( pnts[ faceCnt ].b );
                            if ( numColComponents === 4 )
                            {
                                this._mesh._colors[ 0 ].push( pnts[ faceCnt ].a );
                            }
                        }
                    }
                    this._parentNodes.forEach( function ( node )
                    {
                        node._dirty.colors = true;
                    } );
                }
                else if ( fieldName == "normal" )
                {
                    pnts = this._cf.normal.node._vf.vector;

                    if ( this._vf.normalPerVertex )
                    {
                        this._mesh._normals[ 0 ] = pnts.toGL();
                    }
                    else if ( !this._vf.normalPerVertex )
                    {
                        var indexes = this._vf.index;
                        this._mesh._normals[ 0 ] = [];

                        var faceCnt = 0;
                        for ( i = 0; i < indexes.length; ++i )
                        {
                            if ( ( i > 0 ) && ( i % 3 === 0 ) )
                            {
                                faceCnt++;
                            }

                            this._mesh._normals[ 0 ].push( pnts[ faceCnt ].x );
                            this._mesh._normals[ 0 ].push( pnts[ faceCnt ].y );
                            this._mesh._normals[ 0 ].push( pnts[ faceCnt ].z );
                        }
                    }

                    this._parentNodes.forEach( function ( node )
                    {
                        node._dirty.normals = true;
                    } );
                }
                else if ( fieldName == "texCoord" )
                {
                    var texCoordNode = this._cf.texCoord.node;
                    if ( x3dom.isa( texCoordNode, x3dom.nodeTypes.MultiTextureCoordinate ) )
                    {
                        if ( texCoordNode._cf.texCoord.nodes.length )
                        {texCoordNode = texCoordNode._cf.texCoord.nodes[ 0 ];}
                    }
                    pnts = texCoordNode._vf.point;

                    this._mesh._texCoords[ 0 ] = pnts.toGL();

                    this._parentNodes.forEach( function ( node )
                    {
                        node._dirty.texcoords = true;
                    } );
                }
            }
        }
    )
);
