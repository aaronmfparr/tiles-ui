// HEADER ---------------------------------------------------
/*
	FILE:		zoommin.js
	CREATED:	2013 june 10

	Experiments with maximizing (to window extents) and minimizing a div
	This extends reasizable.js which contained experiments with resizing and moving a div
	
	CHANGELOG:


*/
//--------------------------------

// JAVASCRIPT EXTENSIONS
/*
	Taken from rot.js
 * Sets prototype of this function to an instance of parent function
 * @param {function} parent
 */
Function.prototype.extend = function(parent)
{
	this.prototype = Object.create(parent.prototype);
	this.prototype.constructor = this;
	return this;
}

// this is a workaround for IE (but is unnecessary since we do not support old version of IE)
if (!window.addEventListener)
{
	window.addEventListener	= function(type, listener, useCapture)
	{
		attachEvent('on' + type, function(){ listener(event);});
	}
}

if (!window.removeEventListener)
{
	window.removeEventListener	= function(type, listener, useCapture)
	{
		detachEvent('on' + type, function(){ listener(event);});
	}
}


// NAMESPACE DEFINED -----------------------------------------------------------
var UI	=
{
	// CONSTANTS
	COOKIE_NAME						: "UserInterface",
	AREA_MAP_WRAPPER			: "area_map_wrapper",
	AREA_MAP_HEADER				: "area_map_header",
	AREA_MAP_HEADER_MAX		: "area_map_header_max",
	AREA_MAP_FOOTER				: "area_map_footer",
	AREA_MAP_CANVAS				: "area_map_canvas",
	AREA_MAP_RESIZER			: "area_map_resizer",
	AREA_MAP_BUTTON_SM		: "area_map_button_sm",
	AREA_MAP_BUTTON_LG		: "area_map_button_lg",

	AREA_MAP_MIN_X				: 254,
	AREA_MAP_MIN_Y				: 272,

	// session-data labels
	PLAYER_POSITION_Y			: "player_position_y",
	PLAYER_POSITION_X			: "player_position_x",
	CURSOR_POSITION_Y			: "cursor_position_y",
	CURSOR_POSITION_X			: "cursor_position_x",
	MOUSE_DOWN_TARGET			: "mouse_down_target",
	MOUSE_DOWN_RIGHT			: "mouse_down_right",
	MOUSE_DOWN_POSITION_X	: "mouse_down_x",
	MOUSE_DOWN_POSITION_Y	: "mouse_down_y",
	MOUSE_UP_RIGHT				: "mouse_up_right",
	MOUSE_UP_POSITION_X		: "mouse_up_x",
	MOUSE_UP_POSITION_Y		: "mouse_up_y",
	MOUSE_OFFSET_X				: "mouse_offset_x",
	MOUSE_OFFSET_Y				: "mouse_offset_y",
	VIEWPORT_MAX					: "ui_viewport_max",
	
	resizetimeout					: false,
	// to deal with the last comma
	DUMMY									: "dummy"
};

// EXTENSION of UI "namespace" ----------------------

// FUNCTIONS -------------------------------------------

// ----- UTILITIES
UI.getViewport			= function getViewport()
{
	var e = window , a = 'inner';
	if ( !( 'innerWidth' in e ) )
	{
		a = 'client';
		e = document.documentElement || document.body;
	}
	return { width : e[ a+'Width' ] , height : e[ a+'Height' ] }
}

// ----- DATA OPERATIONS

// Retrieves game data from the cookie and populates sessionStorage
UI.initializeState	= function initializeState()
{

}

// commits game data to a cookie from data in sessionStorage
UI.saveState	= function saveState()
{
	var cookieValue;
	var vert	= sessionStorage.getItem(UI.PLAYER_POSITION_Y);
	var horz	= sessionStorage.getItem(UI.PLAYER_POSITION_X);

	cookieValue	= vert+":"+horz+":";

	UI.setCookie(UI.COOKIE_NAME, cookieValue, 30);
}


// Looks for a Document's Cookie by unique identifier
// returns a string on success. returns null on error.
// cookieID - string identifier of the specific cookie to be retrieved
UI.getCookie	= function getCookie(cookieID)
{
	// Get a string containing all of the cookies
	var allCookies			= document.cookie;
	// search for our cookie amongst all of the cookies except for the first
	var cookieStartPos	= allCookies.indexOf(" " + cookieID + "=");
	// Did our search fail to find our cookie?
	if (cookieStartPos == -1)
		// look for our cookie at the first position in the cookie string
		cookieStartPos = allCookies.indexOf(cookieID + "=");

	// have we found our cookie?
	if (cookieStartPos != -1)
	{
		// determine the start of the data
		cookieStartPos 		= allCookies.indexOf("=", cookieStartPos) + 1;
		// determine the end of the data
		var cookieEndPos	= allCookies.indexOf(";", cookieStartPos);
		if (cookieEndPos == -1)
			cookieEndPos		= allCookies.length;

		// extract our cookie's data from the string containing the list of all the cookies
		var cookieData		= allCookies.substring(cookieStartPos,cookieEndPos);
		// return our cookie's data
		return ( unescape( cookieData ) );
	}

	return null;
}

// Sets a Document's Cookie by Unique Identifier
// cookieID - string, identifier of the specific cookie to set
// cookieValue - string, data
// cookieDaysAlive - integer, number of days from present in which cookie expires
// cookiePath - string, file path to document
// cookieDomain - string, URL domain of website
UI.setCookie	= function setCookie(cookieID, cookieValue, cookieDaysAlive, cookiePath, cookieDomain, cookieSecurity)
{
	var cookieExpires	= new Date();
	cookieExpires.setDate(cookieExpires.getDate() + cookieDaysAlive);

	document.cookie		=		cookieID
											+ "="
											+ escape(cookieValue)
											+ ((cookieExpires==null) ? "" : "; expires="+cookieExpires.toUTCString())
											+ ((typeof cookiePath==='string')			? "; path="+cookiePath : "")
											+ ((typeof cookieDomain==='string')		? "; domain="+cookieDomain : "")
											+ ((typeof cookieSecurity==='boolean')? "; security="+cookieSecurity : "")
										;
}


// INTERFACE / RESPONSE TO EVENT HANDLING
UI.doClick	= function doClick(event)
{
	var targetId		= sessionStorage.getItem(UI.MOUSE_DOWN_TARGET);

	var rightDown		= sessionStorage.getItem(UI.MOUSE_DOWN_RIGHT);
	var posXDown		= sessionStorage.getItem(UI.MOUSE_DOWN_POSITION_X);
	var posYDown		= sessionStorage.getItem(UI.MOUSE_DOWN_POSITION_Y);	

	var rightUp			= sessionStorage.getItem(UI.MOUSE_UP_RIGHT);
	var posXUp			= sessionStorage.getItem(UI.MOUSE_UP_POSITION_X);
	var posYUp			= sessionStorage.getItem(UI.MOUSE_UP_POSITION_Y);

	// not a right click
	if(rightUp=="0")
	{
		if(targetId==event.target.id)
		{
			if(targetId==UI.AREA_MAP_BUTTON_SM)
			{
				UI.doMaximize(event);
			}
			else if(targetId==UI.AREA_MAP_BUTTON_LG)
			{
				UI.doMinimize(event);
			}
		}
	}

	//target.style.height	= posYUp+"px";
	//target.style.width	= posXUp+"px";
}

UI.doMaximize	= function doMaximize(event)
{
	var area_map_canvas		= document.getElementById(UI.AREA_MAP_CANVAS);
	var area_map_wrapper		= document.getElementById(UI.AREA_MAP_WRAPPER);
		// mark event as null to force full execution of maximize method
	if(		event===null
		// if the user is not in maximized viewport mode, assume that they need to initialize
		||	!sessionStorage.getItem(UI.VIEWPORT_MAX)
		)
	{
		// position
		sessionStorage.setItem("area_map_top", area_map_wrapper.style.top);
		sessionStorage.setItem("area_map_left", area_map_wrapper.style.left);
		sessionStorage.setItem("area_map_width", area_map_wrapper.offsetWidth);
		sessionStorage.setItem("area_map_height", area_map_wrapper.offsetHeight);

		// flag maximized mode
		sessionStorage.setItem(UI.VIEWPORT_MAX, true);
		// capture window resize events
		window.addEventListener("resize", UI.onWindowResize, false );


		// do once -----------
		var area_map_header			= document.getElementById(UI.AREA_MAP_HEADER);
		var area_map_footer			= document.getElementById(UI.AREA_MAP_FOOTER);
		var area_map_header_max	= document.getElementById(UI.AREA_MAP_HEADER_MAX);
		area_map_header_max.style.visibility	= "hidden";

		// maximize wrapper
		area_map_wrapper.style.top		= "0px";
		area_map_wrapper.style.left		= "0px";
		area_map_wrapper.style.bottom	= "0px";
		area_map_wrapper.style.right	= "0px";

		// maximize canvas
		area_map_canvas.style.top			= "0px";
		area_map_canvas.style.left		= "0px";
		area_map_canvas.style.bottom	= "0px";
		area_map_canvas.style.right		= "0px";
		// hide header
		area_map_header.style.visibility	= "collapse";
		// hide footer
		area_map_footer.style.visibility	= "collapse";

		// new header
		area_map_header_max.style.visibility	= "visible";
		//area_map_header_max.style.top					= "0px";
		//area_map_header_max.style.left				= "5px";
		//area_map_header_max.style.right				= "5px";
	}

	area_map_wrapper.style.width	= window.innerWidth+"px";
	area_map_wrapper.style.height	= window.innerHeight+"px";

	area_map_canvas.setAttribute("width", window.innerWidth);
	area_map_canvas.setAttribute("height", window.innerHeight);

	// redraw
	TILES.drawPlayarea();
}

UI.doMinimize	= function doMinimize(event)
{
	var area_map_canvas		= document.getElementById(UI.AREA_MAP_CANVAS);
	var area_map_wrapper		= document.getElementById(UI.AREA_MAP_WRAPPER);
	var area_map_header			= document.getElementById(UI.AREA_MAP_HEADER);
	var area_map_footer			= document.getElementById(UI.AREA_MAP_FOOTER);
	var area_map_header_max	= document.getElementById(UI.AREA_MAP_HEADER_MAX);

	sessionStorage.removeItem(UI.VIEWPORT_MAX);
	window.removeEventListener("resize", UI.onWindowResize, false );

	// show header
	area_map_header.style.visibility	= "visible";
	// show footer
	area_map_footer.style.visibility	= "visible";
	// hide header
	area_map_header_max.style.visibility	= "collapse";

		// maximize wrapper
	area_map_wrapper.style.top		= sessionStorage.getItem("area_map_top");
	area_map_wrapper.style.left		= sessionStorage.getItem("area_map_left");
	//area_map_wrapper.style.bottom	= "0px";
	//area_map_wrapper.style.right	= "0px";

		// maximize canvas
	area_map_canvas.style.top			= "10px";
	area_map_canvas.style.left		= "1px";
	area_map_canvas.style.bottom	= "10px";
	area_map_canvas.style.right		= "1px";

	var nWidth		= sessionStorage.getItem("area_map_width")-0;
	var nHeight		= sessionStorage.getItem("area_map_height")-0;

	area_map_wrapper.style.width	= nWidth+"px";
	area_map_wrapper.style.height	= nHeight+"px";

	area_map_canvas.setAttribute("width", (nWidth-2));
	area_map_canvas.setAttribute("height", (nHeight-20));

	// redraw
	TILES.drawPlayarea();
}

UI.doDrag	= function doDrag(event)
{
	var targetId	= sessionStorage.getItem(UI.MOUSE_DOWN_TARGET);
	var position	= UI.getMousePosition(event);
	
	if(targetId	== UI.AREA_MAP_RESIZER)
		UI.resizeMap(position);
	else if(targetId	== UI.AREA_MAP_HEADER)
		UI.moveMap(position);
}

UI.resizeMap	= function resizeMap(position)
{
	var viewport					= UI.getViewport();
	var offX							= sessionStorage.getItem(UI.MOUSE_OFFSET_X)-0;
	var offY							= sessionStorage.getItem(UI.MOUSE_OFFSET_Y)-0;
	var area_map_wrapper	= document.getElementById(UI.AREA_MAP_WRAPPER);
	var area_map_canvas		= document.getElementById(UI.AREA_MAP_CANVAS);
	var draw							= false;
	var new_width;
	var new_height;
	
	// determine if there is a change in width
	if( position.x>viewport.width )
		new_width	= (viewport.width+offX)-area_map_wrapper.offsetLeft;
	else if( (position.x+offX) > (area_map_wrapper.offsetLeft + UI.AREA_MAP_MIN_X) )
		new_width	= (position.x+offX)-area_map_wrapper.offsetLeft;
	else if(area_map_wrapper.offsetWidth > UI.AREA_MAP_MIN_X)
		new_width	= UI.AREA_MAP_MIN_X;
	if(new_width)
	{
		draw			= true;
		// wrapper
		area_map_wrapper.style.width	= new_width+"px";
		// canvas
		area_map_canvas.setAttribute("width", (new_width-2));
	}
	
	// determine if there is a change in height
	if( position.y>viewport.height )
		new_height	= viewport.height-area_map_wrapper.offsetTop;
	else if( (position.y+offY) > (area_map_wrapper.offsetTop + UI.AREA_MAP_MIN_Y) )
		new_height	= (position.y+offY)-area_map_wrapper.offsetTop;
	else if(area_map_wrapper.offsetHeight > UI.AREA_MAP_MIN_Y)
		new_height	= UI.AREA_MAP_MIN_Y;
	if(new_height)
	{
		draw	= true;
		// wrapper
		area_map_wrapper.style.height	= new_height+"px";
		// canvas
		area_map_canvas.setAttribute("height", (new_height-20));
	}

	// if there was a change, redraw
	if(draw)
		TILES.drawPlayarea();
}

UI.moveMap	= function moveMap(position)
{
	var offX = sessionStorage.getItem(UI.MOUSE_OFFSET_X)-0;
	var offY = sessionStorage.getItem(UI.MOUSE_OFFSET_Y)-0;
	
	var viewport	= UI.getViewport();
	// area_map_wrapper
	var area_map_wrapper	= document.getElementById(UI.AREA_MAP_WRAPPER);

	if(position.x>viewport.width)
		area_map_wrapper.style.left	= (viewport.width-offX)+"px";
	else if(position.x>0)
		area_map_wrapper.style.left	= (position.x-offX)+"px";
	else
		area_map_wrapper.style.left	= (0-offX)+"px";

	if(position.y>viewport.height)
		area_map_wrapper.style.top	= (viewport.height-10)+"px";
	else if(position.y>0)
		area_map_wrapper.style.top	= (position.y-offY)+"px";
	else
		area_map_wrapper.style.top	= "0px";
}

// ----- EVENT HANDLING

// returns 1 if the right mouse button was used. 0 if not
UI.getRightClick	= function getRightClick(event)
{
	var rightclick;

	if (event.which)
		rightclick		= (event.which == 3);
	else if (event.button)
		rightclick		= (event.button == 2);

	if(rightclick)
		return 1;
	else
		return 0;
}

// returns the mouse position within the window during the event
UI.getMousePosition	= function getMousePosition(event)
{
	var posX = new Number();
	var posY = new Number();

	if (event.pagex != undefined && event.pagey != undefined)
	{
		posX = event.pagex;
		posY = event.pagey;
	}
	else // Firefox method to get the position
	{
		posX = event.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
		posY = event.clientY + document.body.scrollTop + document.documentElement.scrollTop;
	}

	return { x:posX, y:posY }
}


// ...MOUSE EVENTS... these happen for events that occur within the play area

UI.onMouseDown	= function onMouseDown(event)
{
	var position		= UI.getMousePosition(event);
	var rightclick	= UI.getRightClick(event);

	sessionStorage.setItem(UI.MOUSE_DOWN_TARGET, event.target.id);
	sessionStorage.setItem(UI.MOUSE_DOWN_RIGHT, rightclick);
	sessionStorage.setItem(UI.MOUSE_DOWN_POSITION_X, position.x);
	sessionStorage.setItem(UI.MOUSE_DOWN_POSITION_Y, position.y);
	if(event.target.id==UI.AREA_MAP_HEADER)
	{
		var area_map_wrapper	= document.getElementById(UI.AREA_MAP_WRAPPER);
		sessionStorage.setItem(UI.MOUSE_OFFSET_X, position.x - area_map_wrapper.offsetLeft);
		sessionStorage.setItem(UI.MOUSE_OFFSET_Y, position.y - area_map_wrapper.offsetTop);
		if (event.preventDefault)
			event.preventDefault();
		else
			window.event.returnValue = false;
	}
	else if(event.target.id==UI.AREA_MAP_RESIZER)
	{
		var area_map_wrapper	= document.getElementById(UI.AREA_MAP_WRAPPER);
		sessionStorage.setItem(UI.MOUSE_OFFSET_X, area_map_wrapper.offsetLeft + area_map_wrapper.offsetWidth - position.x);
		sessionStorage.setItem(UI.MOUSE_OFFSET_Y, area_map_wrapper.offsetTop + area_map_wrapper.offsetHeight - position.y);
		if (event.preventDefault)
			event.preventDefault();
		else
			window.event.returnValue = false;
	}
	if(rightclick==0)
	{
		window.addEventListener("mousemove", UI.onMouseMove, false );
	}
}

UI.onMouseUp	= function	onMouseUp(event)
{
	var position		= UI.getMousePosition(event);
	var rightclick	= UI.getRightClick(event);

	sessionStorage.setItem(UI.MOUSE_UP_RIGHT, rightclick);
	sessionStorage.setItem(UI.MOUSE_UP_POSITION_X, position.x);
	sessionStorage.setItem(UI.MOUSE_UP_POSITION_Y, position.y);

	// process the click
	UI.doClick(event);
	
	sessionStorage.removeItem(UI.MOUSE_DOWN_TARGET);
	if(rightclick==0)
		window.removeEventListener("mousemove", UI.onMouseMove, false );
}

UI.onMouseOver	= function onMouseOver(event)
{
	//var position		= UI.getMousePosition(event);

}

UI.onMouseOut	= function onMouseOut(event)
{
	//var position		= UI.getMousePosition(event);

}

UI.onMouseMove	= function onMouseMove(event)
{
	var position		= UI.getMousePosition(event);
	UI.doDrag(event);
}

// ... WINDOW EVENTS ...

UI.onWindowResize	= function onWindowResize(event)
{
	// ignore resize events as long as an actualResizeHandler execution is in the queue
	if ( !UI.resizeTimeout )
	{
		UI.resizeTimeout	= setTimeout
												(
													function()
													{
														UI.resizeTimeout = null;
														UI.doMaximize(event);
														// The actualResizeHandler will execute at a rate of 15fps
													},
													66
												);
	}

}

UI.onLoad	= function onLoad()
{
	// Retrieves game data from the cookie and populates sessionStorage
	UI.initializeState();

	// SetUp View
	if(sessionStorage.getItem(UI.VIEWPORT_MAX))
		UI.doMaximize(null);

	//
	TILES.drawPlayarea();

	// EVENTS
	var target = window;
	target.addEventListener("mousedown", UI.onMouseDown, false );
	target.addEventListener("mouseup", UI.onMouseUp, false );
	//target.addEventListener("mouseover", UI.onMouseOver, false );
	//target.addEventListener("mouseout", UI.onMouseOut, false );
	//target.addEventListener("mousemove", UI.onMouseMove, false );
}

UI.onUnload = function onUnload()
{
	
}

// tiles specific code for drawing on the canvas
// NAMESPACE DEFINED -----------------------------------------------------------
var TILES	=
{
	// CONSTANTS
	PLAYAREA							: "playarea",					// reference to canvas ID
	DIM_TILE							: 36,									// dimensions of a tile image
	COOKIE_NAME						: "GrecianCanvas",

	// session-data labels
	PLAYER_POSITION_Y			: "player_position_y",
	PLAYER_POSITION_X			: "player_position_x",
	CURSOR_POSITION_Y			: "cursor_position_y",
	CURSOR_POSITION_X			: "cursor_position_x",
	MOUSE_DOWN_STATE			: "mouse_down_state",
	MOUSE_DOWN_RIGHT			: "mouse_down_right",
	MOUSE_DOWN_POSITION_X	: "mouse_down_x",
	MOUSE_DOWN_POSITION_Y	: "mouse_down_y",
	MOUSE_UP_RIGHT				: "mouse_up_right",
	MOUSE_UP_POSITION_X		: "mouse_up_x",
	MOUSE_UP_POSITION_Y		: "mouse_up_y"

};

TILES.drawPlayarea	= function drawPlayarea()
{
	var map_id	= "XXX";
	// get the full map or create it if it is not available
	var hidden_canvas	= document.getElementById(map_id);
	if(!hidden_canvas)
	{
		// create hidden canvas
		hidden_canvas										= document.createElement("canvas");
		hidden_canvas.id								= map_id;
		hidden_canvas.width							= 32*TILES.DIM_TILE;
		hidden_canvas.height						= 24*TILES.DIM_TILE;
		hidden_canvas.style.visibility	= "collapse";
		document.getElementById("area_storage").appendChild(hidden_canvas);

		// draw on hidden canvas
		var hidden_context = hidden_canvas.getContext('2d');
		hidden_context.clearRect(0, 0, hidden_context.offsetWidth, hidden_context.offsetHeight);
		//hidden_context.fillStyle	= "rgba(255, 126, 50, 1.0)"; // orange
		//hidden_context.fillRect(0, 0, hidden_context.offsetWidth, hidden_context.offsetHeight);
		//hidden_context.globalCompositeOperation	= "darker";
		var x; // left to right position in row
		var y; // index of row
		var tile_index;
		for(y=0;y<24;y++)
		{
			x	= 0;
			for(x=0;x<32;x++)
			{
				tile_index	= map[y].charAt(x);
				if(tile_index)
					hidden_context.drawImage(imgTile[tile_index], TILES.DIM_TILE*x, TILES.DIM_TILE*y);
				else
					hidden_context.drawImage(imgTile[0], TILES.DIM_TILE*x, TILES.DIM_TILE*y);
			}
		}

		// loads contents of hidden_canvas into bkg_img (a global image)
		map_img.src	= hidden_canvas.toDataURL("image/png");
		// sets up call back when image is done loading
		map_img.addEventListener('load', TILES.drawPlayarea, false);
		return;
	}

	// get the canvas
	var canvas 					= document.getElementById(UI.AREA_MAP_CANVAS);
	var canvasPlayarea	= canvas.getContext('2d');

	// calculate drawing origins
	var userX		= sessionStorage.getItem(TILES.PLAYER_POSITION_X);
	var userY		= sessionStorage.getItem(TILES.PLAYER_POSITION_Y);
	var horz		= userX-0;
	var vert		= userY-0;
	horz				= (horz*TILES.DIM_TILE)-(Math.floor((canvas.offsetWidth/TILES.DIM_TILE)/2)*TILES.DIM_TILE);
	vert				= (vert*TILES.DIM_TILE)-(Math.floor((canvas.offsetHeight/TILES.DIM_TILE)/2)*TILES.DIM_TILE);
	var minHorz	= 0;
	var minVert	= 0;
	if(horz<0)
	{
		if(userX!=null)
			minHorz	= Math.abs(horz);
		else
			minHorz	= 0;
		horz=0;
	}
	if(vert<0)
	{
		if(userY!=null)
			minVert	= Math.abs(vert);
		else
			minVert	= 0;
		vert=0;
	}

	// calculate drawing extents
	var	maxHorz	= canvas.offsetWidth;
	var maxVert	= canvas.offsetHeight;
	if((horz+maxHorz)>hidden_canvas.width)
		maxHorz		= hidden_canvas.width-horz;
	if((vert+maxVert)>hidden_canvas.height)
		maxVert		= hidden_canvas.height-vert;

	// draw the map
	canvasPlayarea.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);
	//canvasPlayarea.fillStyle	= "rgba(255, 126, 50, 1.0)"; // orange
	//canvasPlayarea.fillRect(0, 0, canvasPlayarea.offsetWidth, canvasPlayarea.offsetHeight);
	//canvasPlayarea.globalCompositeOperation	= "darker";
	canvasPlayarea.drawImage(map_img, horz, vert, maxHorz, maxVert, minHorz, minVert, maxHorz, maxVert );

	//canvasPlayarea.globalCompositeOperation	= "source-over";
	//canvasPlayarea.drawImage(imgPlayer, TILES.DIM_TILE*3, TILES.DIM_TILE*3);
}

// INITIALIZATION --------------------------------------------------------------
// runs when script is loaded - but before page is finished loading


	// MAP
	var map						= new Array(24);
	map[ 0]="77772722227277777777777777777777";
	map[ 1]="77227222227777277777777777777777";
	map[ 2]="77279999999977772277777777777777";
	map[ 3]="77729555555922272777223333333777";
	map[ 4]="77729585585999277222277777333777";
	map[ 5]="22729553335555277277777777333777";
	map[ 6]="27729563335555222222222227377777";
	map[ 7]="77729553335555277772777722277777";
	map[ 8]="77729585585999272772777777277777";
	map[ 9]="77729555555922277722777777277777";
	map[10]="77729999999922227227777772277777";
	map[11]="77722222222227777277777772777777";
	map[12]="77272222222277722222222222222777";
	map[13]="77777777777277777777777777772777";
	map[14]="77777777722277777777722227772777";
	map[15]="77772222222222222777777722222777";
	map[16]="77722222222222222222777777777777";
	map[17]="77793339933399333972777777777777";
	map[18]="77799999333439999972227777777777";
	map[19]="77777779333339772222222222777777";
	map[20]="77777779999999722222227777777777";
	map[21]="77777777777777777777777777777777";
	map[22]="77777777777777777777777777777777";
	map[23]="77777777777777777777777777777777";

	// IMAGE CACHING
	var urlPlayerIcon	= "img/character0.png";
	var imgPlayer			= new Image();
	imgPlayer.src			= urlPlayerIcon;

	// global background image set up to store entire map
	var map_img				= new Image();

	var urlCursor			= "img/tile_outline.gif";
	var imgCursor			= new Image();
	imgCursor.src			= urlCursor;

	var urlTile				= new Array(10);
	var imgTile				= new Array(10);
	for (var x=0; x<10; x++)
	{
		urlTile[x]			= "img/tile"+x+".png";
		imgTile[x]			= new Image();
		imgTile[x].src	= urlTile[x];
	}

// SETUP EVENTS

window.addEventListener("load", UI.onLoad, false );
window.addEventListener("unload", UI.onUnload, false );
