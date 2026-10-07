$(document).ready(function(){
	// Track current active panel
	let activePanel = null;
	
	// Function to hide all panels
	function hideAllPanels() {
		$("#piano, #pianonotes, #tc, #bc, #full, #b, #bt, #bn, #nd").removeClass("is-active").addClass("is-hidden");
		$("button").removeClass("btn-active");
		activePanel = null;
	}
	
	// Calculate footer height and position panels properly
	function adjustPanelPositions() {
		let footerHeight = $("footer").outerHeight();
		// Set the CSS variables for panel positioning
		document.documentElement.style.setProperty('--footer-height', footerHeight + "px");
	}
	
	// Adjust on document ready - wrapped in setTimeout to ensure DOM is fully rendered
	setTimeout(adjustPanelPositions, 100);
	
	// Adjust on window resize
	$(window).resize(adjustPanelPositions);
	
	// Also adjust after window fully loads (images, etc.)
	$(window).on('load', adjustPanelPositions);
	
	// Piano button
	$( "#pButton" ).click(function(){
		if ($("#piano").hasClass("is-active")) {
			// If already active, just hide it
			$("#piano").removeClass("is-active").addClass("is-hidden");
			$(this).removeClass("btn-active");
			activePanel = null;
		} else {
			// If not active, hide all then show this one
			hideAllPanels();
			$("#piano").removeClass("is-hidden").addClass("is-active");
			$(this).addClass("btn-active");
			activePanel = "piano";
			adjustPanelPositions(); // Ensure position is correct
		}
	});
	
	// Piano notes button
	$( "#pnButton" ).click(function(){
		if ($("#pianonotes").hasClass("is-active")) {
			$("#pianonotes").removeClass("is-active").addClass("is-hidden");
			$(this).removeClass("btn-active");
			activePanel = null;
		} else {
			hideAllPanels();
			$("#pianonotes").removeClass("is-hidden").addClass("is-active");
			$(this).addClass("btn-active");
			activePanel = "pianonotes";
			adjustPanelPositions(); // Ensure position is correct
		}
	});
	
	// Treble clef button
	$( "#tcButton" ).click(function(){
		if ($("#tc").hasClass("is-active")) {
			$("#tc").removeClass("is-active").addClass("is-hidden");
			$(this).removeClass("btn-active");
			activePanel = null;
		} else {
			hideAllPanels();
			$("#tc").removeClass("is-hidden").addClass("is-active");
			$(this).addClass("btn-active");
			activePanel = "tc";
			adjustPanelPositions(); // Ensure position is correct
		}
	});
	
	// Bass clef button
	$( "#bcButton" ).click(function(){
		if ($("#bc").hasClass("is-active")) {
			$("#bc").removeClass("is-active").addClass("is-hidden");
			$(this).removeClass("btn-active");
			activePanel = null;
		} else {
			hideAllPanels();
			$("#bc").removeClass("is-hidden").addClass("is-active");
			$(this).addClass("btn-active");
			activePanel = "bc";
			adjustPanelPositions(); // Ensure position is correct
		}
	});
	
	// Treble notes button
	$( "#fcButton" ).click(function(){
		if ($("#full").hasClass("is-active")) {
			$("#full").removeClass("is-active").addClass("is-hidden");
			$(this).removeClass("btn-active");
			activePanel = null;
		} else {
			hideAllPanels();
			$("#full").removeClass("is-hidden").addClass("is-active");
			$(this).addClass("btn-active");
			activePanel = "full";
			adjustPanelPositions(); // Ensure position is correct
		}
	});
	
	// Bass button
	$( "#bButton" ).click(function(){
		if ($("#b").hasClass("is-active")) {
			$("#b").removeClass("is-active").addClass("is-hidden");
			$(this).removeClass("btn-active");
			activePanel = null;
		} else {
			hideAllPanels();
			$("#b").removeClass("is-hidden").addClass("is-active");
			$(this).addClass("btn-active");
			activePanel = "b";
			adjustPanelPositions(); // Ensure position is correct
		}
	});	
	
	// Tab numbers button
	$( "#btButton" ).click(function(){
		if ($("#bt").hasClass("is-active")) {
			$("#bt").removeClass("is-active").addClass("is-hidden");
			$(this).removeClass("btn-active");
			activePanel = null;
		} else {
			hideAllPanels();
			$("#bt").removeClass("is-hidden").addClass("is-active");
			$(this).addClass("btn-active");
			activePanel = "bt";
			adjustPanelPositions(); // Ensure position is correct
		}
	});		
	
	// Bass notes button
	$( "#bnButton" ).click(function(){
		if ($("#bn").hasClass("is-active")) {
			$("#bn").removeClass("is-active").addClass("is-hidden");
			$(this).removeClass("btn-active");
			activePanel = null;
		} else {
			hideAllPanels();
			$("#bn").removeClass("is-hidden").addClass("is-active");
			$(this).addClass("btn-active");
			activePanel = "bn";
			adjustPanelPositions(); // Ensure position is correct
		}
	});	
	
	// Bass clef notes button
	$( "#ndButton" ).click(function(){
		if ($("#nd").hasClass("is-active")) {
			$("#nd").removeClass("is-active").addClass("is-hidden");
			$(this).removeClass("btn-active");
			activePanel = null;
		} else {
			hideAllPanels();
			$("#nd").removeClass("is-hidden").addClass("is-active");
			$(this).addClass("btn-active");
			activePanel = "nd";
			adjustPanelPositions(); // Ensure position is correct
		}
	});
	
	// Hide All Panels button
	$( "#hideAllButton" ).click(function(){
		hideAllPanels();
	});
});