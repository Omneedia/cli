<html>

<head>
	<title>{TITLE}</title>
	<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<link rel="stylesheet" type="text/css" href="/mobile/css/jquery.devicemock.css">
	<link rel="stylesheet" type="text/css" href="/mobile/css/display.css">
	<script src="/mobile/js/jquery.js"></script>
	<script src="/mobile/js/jquery.devicemock.js"></script>
	<link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons">
	<link rel="stylesheet" href="https://code.getmdl.io/1.3.0/material.light_blue-blue.min.css">
	<script defer src="https://code.getmdl.io/1.3.0/material.min.js"></script>
</head>

<body>
	<table style="width:100%;height:100%">
	<tr>
	<td style="width:100%;height:100%" align=center valign=middle>
		<div class="device" id="phone_portrait" style="display:none">
			<iframe style="position:relative;top:0px;left:0px;width:100%;height:100%" scrolling="no" class="force-mobile"></iframe>
		</div>
		<div class="device" id="phone_landscape" style="display:none">
			<iframe style="position:relative;top:0px;left:0px;width:100%;height:100%" scrolling="no" class="force-mobile"></iframe>
		</div>			
		<div class="device" id="tablet_portrait" style="display:none">
			<iframe style="-webkit-transform:scale(0.7);-moz-transform-scale(0.7);position:relative;top:0px;left:0px;" scrolling="no" class="force-mobile"></iframe>
		</div>	
		<div class="device" id="tablet_landscape" style="display:none">
			<iframe style="-webkit-transform:scale(0.7);-moz-transform-scale(0.7);position:relative;top:0px;left:0px;" scrolling="no" class="force-mobile"></iframe>
		</div>		
	</td>
	</tr>
	</table>
	<div class="switcher">
		<div class="switch">
			<div id="tala" class="dselected"><div class="tablet landscape"></div></div>
			<div id="tapo" class="dborder"><div class="tablet portrait"></div></div>
			<div id="phla" class="dborder"><div class="phone landscape"></div></div>
			<div id="phpo" class="dborder"><div class="phone portrait"></div></div>
		</div>
		<div class="os" style="text-align:center">
			<div id="ios" class="selected"><div class="ios"></div><small><small>iOS</small></small></div>
			<div id="android" class="border"><div class="android"></div><small><small>android</small></small></div>
			<!--div id="windows" class="border"><div class="windows"></div><small><small>windows</small></small></div-->
		</div> 
	</div>
	<div class="display"><b>{TITLE}</b><br><small>{DESCRIPTION}<br>{VERSION}<br>{COPYRIGHT}</small></div>
	<div class="displayCSS"></div>
	<div class="qrcode"></div>
	<script>
		var URL="{URL}";
		var System = "{SYSTEM}";
		var Type = "{TYPE}";
		var Orientation = "{ORIENTATION}";
		
		if (Type=="tablet") var size='9x'; else var size='5x';

		$("#phone_portrait").deviceMock({
			type : "phone",
			size : '5x',
			theme : "black",
			orientation : 'portrait',
			imgPath : "/mobile/css/img/",
			cssPrefix : "df-"
		});	
		$("#phone_landscape").deviceMock({
			type : 'phone',
			size : '5x',
			theme : "black",
			orientation : 'landscape',
			imgPath : "/mobile/css/img/",
			cssPrefix : "df-"
		});	
		$("#tablet_portrait").deviceMock({
			type : "tablet",
			size : '9x',
			theme : "black",
			orientation : 'portrait',
			imgPath : "/mobile/css/img/",
			cssPrefix : "df-"
		});	
		$("#tablet_landscape").deviceMock({
			type : 'tablet',
			size : '9x',
			theme : "black",
			orientation : 'landscape',
			imgPath : "/mobile/css/img/",
			cssPrefix : "df-"
		});
		function display(type,orientation,system) {
			$('.device').hide();
			$('#'+type+'_'+orientation).show();	
			$('#'+type+'_'+orientation+' iframe').attr('src',URL+"?ionicPlatform="+System);
		};
		$('#tala').click(function(e) {
			Type="tablet";
			Orientation="landscape";
			$('#tala').attr('class', 'dselected');
			$('#tapo').attr('class', 'dborder');
			$('#phpo').attr('class', 'dborder');
			$('#phla').attr('class', 'dborder');
			display(Type,Orientation,System);
			$('#'+Type+'_'+Orientation+' iframe').css('width','770px');
			$('#'+Type+'_'+Orientation+' iframe').css('height','578px');
		});
		$('#tapo').click(function(e) {
			Type="tablet";
			Orientation="portrait";
			$('#tala').attr('class', 'dborder');
			$('#tapo').attr('class', 'dselected');
			$('#phpo').attr('class', 'dborder');
			$('#phla').attr('class', 'dborder');
			display(Type,Orientation,System);
			$('#'+Type+'_'+Orientation+' iframe').css('height','770px');
			$('#'+Type+'_'+Orientation+' iframe').css('width','578px');			
		});
		$('#phla').click(function(e) {
			Type="phone";
			Orientation="landscape";
			$('#tala').attr('class', 'dborder');
			$('#tapo').attr('class', 'dborder');
			$('#phpo').attr('class', 'dborder');
			$('#phla').attr('class', 'dselected');
			display(Type,Orientation,System);
		});
		$('#phpo').click(function(e) {
			Type="phone";
			Orientation="portrait";
			$('#tala').attr('class', 'dborder');
			$('#tapo').attr('class', 'dborder');
			$('#phpo').attr('class', 'dselected');
			$('#phla').attr('class', 'dborder');
			display(Type,Orientation,System);
		});		

		$('#ios').click(function(e) {
			$('#ios').attr('class', 'selected');
			$('#android').attr('class', 'border');
			$('#windows').attr('class', 'border');
			System='ios';
			var url=URL+"?ionicPlatform="+System;
			$('#'+Type+'_'+Orientation+' iframe').attr('src',URL+"?ionicPlatform="+System);
		});			
		$('#android').click(function(e) {
			$('#ios').attr('class', 'border');
			$('#android').attr('class', 'selected');
			$('#windows').attr('class', 'border');
			System='android';
			var url=URL+"?ionicPlatform="+System;
			$('#'+Type+'_'+Orientation+' iframe').attr('src',URL+"?ionicPlatform="+System);
		});
		$('#windows').click(function(e) {
			$('#ios').attr('class', 'border');
			$('#android').attr('class', 'border');
			$('#windows').attr('class', 'selected');
			System='windows';
			var url=URL+"?ionicPlatform="+System;
			$('#'+Type+'_'+Orientation+' iframe').attr('src',URL+"?ionicPlatform="+System);
		});	
				
		$('#tala').attr('class', 'dborder');
		$('#tapo').attr('class', 'dborder');
		$('#phpo').attr('class', 'dborder');
		$('#phla').attr('class', 'dborder');
		$('#ios').attr('class', 'border');
		$('#android').attr('class', 'border');
		$('#windows').attr('class', 'border');
		
		$('#'+Type.substr(0,2)+Orientation.substr(0,2)).attr('class','dselected');
		$('#'+System).attr('class','selected');
		
		$('.device').hide();
		$('#'+Type+'_'+Orientation).show();
		$('#'+Type+'_'+Orientation+' iframe').attr('src',URL+"?ionicPlatform="+System);


	</script>
</body>

</html>