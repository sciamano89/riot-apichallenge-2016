//--------------------------------------------------------------------------------------------------------------
//Author: 		Raimondo Previdi
//File name:	main.js
//Date:			4/26/2016
//Info:			Main script for HTML page (mainly buttons).
//Sources:		- http://jquery-howto.blogspot.com/2009/09/get-url-parameters-values-with-jquery.html
//--------------------------------------------------------------------------------------------------------------

//data
var m_data = ["constants", "summoner", "champions", "stacked", "selection"];

//references
var m_stackedChart;
var m_donutChart;
var m_championsTable;
var m_scrolledOnce = false;
var m_chestsEarned = Array();

//setup user selection
m_data["selection"] = Array();
m_data["champions"] = Array();

//setup riot's constants
m_patch = "6.10.1";
m_data["constants"] = ["top", "jg", "mid", "supp", "adc", "map"];
m_data["constants"]["top"]  = ["primary", "secondary"];
m_data["constants"]["jg"]  = ["primary", "secondary"];
m_data["constants"]["mid"]  = ["primary", "secondary"];
m_data["constants"]["supp"]  = ["primary", "secondary"];
m_data["constants"]["adc"]  = ["primary", "secondary"];
m_data["constants"]["top"]["primary"] = [266, 31, 122, 36, 245, 114, 41, 86, 150, 420, 39, 126, 85, 54, 62, 75, 111, 2, 80, 78, 58, 92, 68, 13, 98, 27, 14, 17, 48, 23, 6, 8, 106, 83];
m_data["constants"]["jg"]["primary"] = [32, 60, 28, 9, 79, 120, 59, 24, 121, 203, 64, 57, 11, 76, 56, 20, 33, 421, 107, 113, 35, 102, 72, 77, 254, 19, 5, 154];
m_data["constants"]["mid"]["primary"] = [103, 84, 34, 1, 136, 268, 63, 69, 131, 105, 3, 74, 30, 38, 55, 10, 7, 127, 99, 90, 61, 50, 134, 163, 91, 4, 45, 161, 112, 101, 157, 238, 115];
m_data["constants"]["supp"]["primary"] = [12, 432, 53, 201, 40, 43, 89, 117, 25, 267, 37, 16, 223, 44, 412, 26, 143];
m_data["constants"]["adc"]["primary"] = [22, 51, 42, 119, 81, 104, 202, 222, 429, 96, 236, 21, 82, 133, 15, 18, 29, 110, 67];
/*------------------------------------------------------------------------------------------------------
	FUNCTIONS
------------------------------------------------------------------------------------------------------*/
//On document ready
$(document).ready(function() {
	console.log ("page ready");	
});

function DisplayError(message)
{
	$('#intro-header').text("Error").css({'color':'#f45b5b'});
	$('#error-info').text(message);
}

//Attempts to get summoner name and region if they're specified in the URL
function GetNameAndRegionFromURL()
{
	//custom jquery function
	$.extend({
	  getUrlVars: function(){
		var vars = [], hash;
		var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
		for(var i = 0; i < hashes.length; i++)
		{
		  hash = hashes[i].split('=');
		  vars.push(hash[0]);
		  vars[hash[0]] = hash[1];
		}
		return vars;
	  },
	  getUrlVar: function(name){
		return $.getUrlVars()[name];
	  }
	});
	
	//get name and region from URL
	var pName = $.getUrlVar('name');
	var pRegion = $.getUrlVar('region');
	
	//check if name and region were in the URL
	if (pName != null || pRegion != null)
	{
		//get summoner data		
		$.get("http://www.masteryprofiler.com/php/api-caller.php?op=1&region=" + pRegion + "&name=" + pName, function(jsonSummData){
			var pData;
			
			try
			{
				pData = JSON.parse(jsonSummData);
			}
			catch (e)
			{
				p_message = jsonSummData;
				DisplayError(p_message);
				return;
			}
			
			$('#loading-section').removeClass('section-hidden');
			$('#intro-header').text("Loading").css({'color':'white'});
			$('#bar-intro>span').width("30%");
			
			var pResult = "";
			
			//store data
			for (pSummoner in pData)
			{
				m_data["summoner"] = pData[pSummoner];
			}
			
			//insert summoner name in the summary profile
			$('#test-summary-profile div.test-1-1>span').text(m_data["summoner"]["name"]);

			console.log ("retrieved summoner id based on region and name");
			
			//get summoner's rank data
			$.get("http://www.masteryprofiler.com/php/api-caller.php?op=3&region=" + pRegion + "&summonerId=" + m_data["summoner"]["id"], function(jsonRankData){
				var pRankData;
				var isUnranked = false;
				
				try
				{
					pRankData = JSON.parse(jsonRankData);
				}
				catch (e)
				{
					console.log (jsonRankData);
					if (jsonRankData != "Unranked")
					{
						$('#loading-section').addClass('section-hidden');
						p_message = jsonRankData;
						DisplayError(p_message);
						return;
					}
					else
						isUnranked = true;
				}
				
				$('#bar-intro>span').width("60%");

				var pRankString = "";
				var pRankTier = "";

				if (isUnranked === false)
				{
					for (pRankedSummoner in pRankData)
					{
						pRankTier = pRankData[pRankedSummoner][0]["tier"].toLowerCase();
						pRankString = pRankTier;
						pRankString = pRankString.charAt(0).toUpperCase() + pRankString.substr(1);
						pRankString += " " + pRankData[pRankedSummoner][0]["entries"][0]["division"];
					}
				}
				else
				{
					pRankString = "Unranked";
					pRankTier = "unranked";
				}
				
				//insert summoner Rank icon, tier, and division in the Summary - Summoner Profile section
				$('#test-summary-profile #rank').text(pRankString);
				$('#test-summary-profile #rank-icon').attr("src", "img/rank-icons/" + pRankTier + ".png");
				
				$('#bar-intro>span').width("75%");

				//get champions' mastery data
				$.get("http://www.masteryprofiler.com/php/api-caller.php?op=2&region=" + pRegion + "&platformId=" + GetPlatformId(pRegion) + "&summonerId=" + m_data["summoner"]["id"], function(jsonMasteryData){
					var pData;
					
					try
					{
						 pData = JSON.parse(jsonMasteryData);	
					}
					catch (e)
					{
						$('#loading-section').addClass('section-hidden');
						p_message = "Sorry about that. There was an error retrieving Mastery information from Riot. Please report this error to contact@masteryprofiler.com";
						DisplayError(p_message);
						return;
					}
					
					if (pData.length === 0)
					{
						$('#loading-section').addClass('section-hidden');
						p_message = "The Summoner does not have any Mastery information.";
						DisplayError(p_message);
						return;
					}
					
					$('#bar-intro>span').width("90%");
					
					var tempRes = "";
					var p_n1ChampId;
					var p_n1ChampPoints;
					var p_highestChampion_counter = 0;
					var p_nextChampionToMasterId = 0;
					var p_nextChampionToMasterPoints = 0;
					var p_nextChampionToMasterLevel = 12;
					var p_nextChampionToEarnChest = 0;
					var p_is5orHigher = false;
					
					//store data
					for (p_champion in pData)
					{
						//keep track of the first champion (highest champion points)
						if (p_highestChampion_counter === 0)
						{
							p_n1ChampId = pData[p_champion]["championId"];
							p_n1ChampPoints = pData[p_champion]["championPoints"];
						}
						
						//if first champion (highest champ pts) OR savedLevel < this champs Level OR we have at least 1 champ that's lvl 5 and savedPts/Tokens < this champ's tokens
						if (p_nextChampionToMasterId === 0 || p_nextChampionToMasterLevel < pData[p_champion]["championLevel"] || (p_is5orHigher === true && p_nextChampionToMasterPoints < pData[p_champion]["tokensEarned"]))
						{
							if (pData[p_champion]["championLevel"] < 7)
							{
								p_nextChampionToMasterId = pData[p_champion]["championId"];
								p_nextChampionToMasterLevel = pData[p_champion]["championLevel"];
								if (pData[p_champion]["championLevel"] >= 5)
								{
									p_is5orHigher = true;
									p_nextChampionToMasterPoints = pData[p_champion]["tokensEarned"];
								}
								else
									p_nextChampionToMasterPoints = pData[p_champion]["championPointsUntilNextLevel"];
							}
						}
						
						//keep track of first champion with no chest (that's the next champion to get a chest with, because it has the highest champ points)
						if (p_nextChampionToEarnChest === 0)
						{
							if (pData[p_champion]["chestGranted"] === false)
								p_nextChampionToEarnChest = pData[p_champion]["championId"];
						}
						
						//keep track of chests earned and save the champion by id, to map later for lane distribution
						if (pData[p_champion]["chestGranted"] === true)
							m_chestsEarned.push (pData[p_champion]["championId"]);
							
						m_data["champions"][pData[p_champion]["championId"]] = pData[p_champion];
						
						p_highestChampion_counter++;
					}
										
					console.log ("retrieved mastery data based on region and summoner id");
					
					//retrieve static data from API (champion names and icon names)
					$.get("http://ddragon.leagueoflegends.com/cdn/" + m_patch + "/data/en_US/champion.json", function(p_data){		
						for (p_champion in p_data["data"])
						{
							var p_champData = Array();
							p_champData = ["name", "icon"];
							var p_key = p_data["data"][p_champion]["key"];
							
							p_champData["name"] = p_data["data"][p_champion]["name"];
							p_champData["icon"] = p_data["data"][p_champion]["id"];
							
							m_data["constants"]["map"][p_key] = p_champData;
						}
						
						console.log ("retrieved all champion names and icon names");			
						
						//store highest champion icon and points inside Summary - Summoner Profile
						$('#test-summary-profile #favorite-champion').attr("src", "http://ddragon.leagueoflegends.com/cdn/" + m_patch + "/img/champion/"+ m_data["constants"]["map"][p_n1ChampId]["icon"] +".png");
						$('#test-summary-profile #favorite-champ-points').text(kFormatter(p_n1ChampPoints) + " pts");
						
						//store next champion to master icon and points inside Summary - Champions Mastered
						$('#test-summary-champions #nexttomaster-champion').attr("src", "http://ddragon.leagueoflegends.com/cdn/" + m_patch + "/img/champion/"+ m_data["constants"]["map"][p_nextChampionToMasterId]["icon"] +".png");
						var p_nextChampToMasterText = "";
						if (p_nextChampionToMasterLevel >= 5)
						{
							var tempNumOfTokens = (p_nextChampionToMasterLevel-3)-p_nextChampionToMasterPoints;
							if (tempNumOfTokens === 1)
								p_nextChampToMasterText = tempNumOfTokens + " token left";
							else
								p_nextChampToMasterText = tempNumOfTokens + " tokens left";
						}
						else
							p_nextChampToMasterText = p_nextChampionToMasterPoints + " pts left";
						$('#test-summary-champions #nexttomaster-champ-points').text(p_nextChampToMasterText);
						
						//store next champion to earn a chest with inside Summary - Chests Earned
						$('#test-summary-chests #nexttoearnchest-champion').attr("src", "http://ddragon.leagueoflegends.com/cdn/" + m_patch + "/img/champion/"+ m_data["constants"]["map"][p_nextChampionToEarnChest]["icon"] +".png");
						
						//create first selection
						m_data["selection"]["lane"] = "all";
						m_data["selection"]["group"] = "primary";
						m_data["selection"]["level"] = "-1";
						
						//start generating data for charts
						CreateDataForStackedChart();
						$('#bar-intro>span').width("95%");
					});	
				});
			});
		});
	}
	else
	{
		$('#intro-header').text("");
		$('#error-info').text("Begin by providing a League of Legends Summoner Name and Region.").css({'color':'white'});
	}
}

//------------------------------------------------------------------------------------------------------
//	HELPER FUNCTIONS
//------------------------------------------------------------------------------------------------------
//tranform region -> platform
function GetPlatformId(region)
{
	var newVal;
	if (region === "lan")
	{
		newVal = "la1";
	}
	else if (region === "las")
	{
		newVal = "la2";
	}
	else if (region === "eune")
	{
		newVal = "eun1";
	}
	else if (region === "oce")
	{
		newVal = "oc1";
	}
	else
	{
		newVal = region + "1";
	}
	return newVal;
}

//calculates the Max Mastery Score Per Lane, passing the array
function CalculateMMSPL(lane, group)
{
	if (lane !== "all")
		return (7 * m_data["constants"][lane][group].length);
	else
	{		
		var pSum = 0;
		for (pLane in m_data["stacked"]) //use stack instead of constants, because constants includes "map"
		{
			pSum += (7 * m_data["constants"][pLane][group].length);
		}
		return pSum;
	}
}

//calculate # of Champions per Mastery Level Per Lane
function CalculateMasteryScoreOrNumOfChampions(lane, group, plevel, numOfChampions)
{
	var level = Number(plevel);
	
	if (lane === "all")	//if all lanes
	{
		var i = 0;
		if (numOfChampions === false)
			i = level-1;	//returns the mastery score times the # of champions in that lane
		
		if (level > 0)
		{
			var p_count = 0;
			for (plane in m_data["stacked"])
				p_count += (m_data["stacked"][plane][level-1].length*(i+1));
				
			return (p_count);	
		}
		else
		{
			var p_total = 0;
			for (plane in m_data["stacked"])
			{	
				var p_count = 0;
				for (var x=0; x<7; ++x)
				{
					p_count += m_data["stacked"][plane][x].length;
				}
				p_total += m_data["constants"][plane][group].length - p_count;
			}
					
			return (p_total);
		}
	}
	else
	{
		var i = 0;
		if (numOfChampions === false)
			i = level-1;	//returns the mastery score times the # of champions in that lane
		
		if (level > 0)
			return ((m_data["stacked"][lane][level-1] != undefined) ? m_data["stacked"][lane][level-1].length*(i+1) : 0);
		else	//if lvl is 0, subtracts the # of champs in that lane user owns from the total # of champs in that lane
		{
			var p_count = 0;
			for (var x=0; x<7; ++x)
				p_count += m_data["stacked"][lane][x].length;
			return (m_data["constants"][lane][group].length - p_count);
		}
	}
}

function CalculateMasteryScore(lane, group, numOfChampions)
{
	var pMasteryScore = 0;
	for (var i=1; i<6; ++i)
		pMasteryScore += CalculateMasteryScoreOrNumOfChampions(lane, group, i, numOfChampions);
	return pMasteryScore;
}

//calculate the grade
function CalculateGrade(points)
{
	if (points === 0)
		return "D-";
	else if (points > 0 && points < 500)
		return "D";
	else if (points >= 500 && points < 1100)
		return "D+";
	else if (points >= 1100 && points < 1800)
		return "C-";
	else if (points >= 1800 && points < 3600)
		return "C";
	else if (points >= 3600 && points < 6000)
		return "C+";
	else if (points >= 6000 && points < 7650)
		return "B-";
	else if (points >= 7650 && points < 9550)
		return "B";
	else if (points >= 9550 && points < 12600)
		return "B+";
	else if (points >= 12600 && points < 16000)
		return "A-";
	else if (points >= 16000 && points < 21600)
		return "A";
	else if (points >= 21600 && points < 33000)
		return "A+";
	else if (points >= 33000 && points < 63000)
		return "S-";
	else if (points >= 63000 && points < 102000)
		return "S";
	else if (points >= 102000)
		return "S+";		
}

//converts pretty string into variable names
function ConvertStringToLane(pLane)
{
	switch(pLane)
	{
		case "Top":
			return "top";
		case "Jungle":
			return "jg";
		case "Mid":
			return "mid";
		case "Support":
			return "supp";
		case "ADC":
			return "adc";	
	}
}

//converts variable names into pretty strings
function ConvertLaneToString(pLane)
{
	switch(pLane)
	{
		case "top":
			return "Top";
		case "jg":
			return "Jungle";
		case "mid":
			return "Mid";
		case "supp":
			return "Support";
		case "adc":
			return "ADC";	
	}
}

//converts grades to numbers (for sorting purposes)
function ConvertGradeToNumber(pGrade)
{			
	switch(pGrade)
	{
		case "S+":
			return 15;
		case "S":
			return 14;
		case "S-":
			return 13;
		case "A+":
			return 12;
		case "A":
			return 11;	
		case "A-":
			return 10;	
		case "B+":
			return 9;	
		case "B":
			return 8;	
		case "B-":
			return 7;	
		case "C+":
			return 6;	
		case "C":
			return 5;	
		case "C-":
			return 4;	
		case "D+":
			return 3;	
		case "D":
			return 2;	
		case "D-":
			return 1;
		case "F":
			return 0;	
	}
}

//formats numbers (adds 'k' suffix to the thousands)
function kFormatter(num) 
{
    return num > 9999 ? (num/1000).toFixed(1) + 'k' : num
}

//random number generator (both are inclusive)
function GetRandom(min, max)
{
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

//get Random champion lvl 5 Icon Name (for background)
function GetRandomIconName()
{
	var p_champIconName = "";
	var p_champs = Array();
	
	//loop through all champions at lvl 5 in all lanes, and store them temporarily
	for (pLane in m_data["stacked"])
		for (pChamp in m_data["stacked"][pLane][4])
			p_champs.push (m_data["stacked"][pLane][4][pChamp]);
			
	var randomIndex = GetRandom(0, p_champs.length-1)
	
	//in case user has no champ at lvl 5, pick a random champion
	if (p_champs.length === 0)
		$('.test-summary-individual-containers').css({"background-image": "url(http://ddragon.leagueoflegends.com/cdn/img/champion/splash/Nasus_6.jpg)"});
	else
		$('.test-summary-individual-containers').css({"background-image": "url(http://ddragon.leagueoflegends.com/cdn/img/champion/splash/" + m_data["constants"]["map"][p_champs[randomIndex]]["icon"] + "_0.jpg)"});
		
		
	$('#website-intro').addClass('section-hidden');
	$('.section-lanes').removeClass('section-hidden');
	$('footer').removeClass('fixed-bottom');
	$('footer>.banner').removeClass('fixed-bottom-banner');
	$('#champions-table_length').css({"visibility": "hidden"});
}

//------------------------------------------------------------------------------------------------------
//	PROGRESS BARS
//------------------------------------------------------------------------------------------------------
function AnimateProgressBars()
{
	$(function() {
		$(".meter > span").each(function() {
			$(this)
				.data("origWidth", $(this).width())
				.width(0)
				.animate({
					width: $(this).data("origWidth")
				}, 1200);
		});
	});
}

//------------------------------------------------------------------------------------------------------
//	CHARTS
//------------------------------------------------------------------------------------------------------
//create temp data to feed into chart
function CreateDataForStackedChart()
{
	var p_top = [0,1,2,3,4];
	var p_jg = [0,1,2,3,4];
	var p_mid = [0,1,2,3,4];
	var p_supp = [0,1,2,3,4];
	var p_adc = [0,1,2,3,4];
	
	for (var i=0; i<7; ++i)
	{
		p_top[i] = new Array();
		p_jg[i] = new Array();
		p_mid[i] = new Array();
		p_supp[i] = new Array();
		p_adc[i] = new Array();
	}
	
	for (pChamp in m_data["champions"])
	{
		if ($.inArray(m_data["champions"][pChamp]["championId"], m_data["constants"]["top"]["primary"]) >=0 )
		{
			p_top[((m_data["champions"][pChamp]["championLevel"])-1)].push(m_data["champions"][pChamp]["championId"]);
		}
		else if ($.inArray(m_data["champions"][pChamp]["championId"], m_data["constants"]["jg"]["primary"]) >=0 )
		{
			p_jg[((m_data["champions"][pChamp]["championLevel"])-1)].push(m_data["champions"][pChamp]["championId"]);
		}
		else if ($.inArray(m_data["champions"][pChamp]["championId"], m_data["constants"]["mid"]["primary"]) >=0 )
		{
			try
			{
				p_mid[((m_data["champions"][pChamp]["championLevel"])-1)].push(m_data["champions"][pChamp]["championId"]);
			}
			catch(e)
			{
				$('#loading-section').addClass('section-hidden');
				var p_message = "Ritoplz, update your API to include Taliyah!";
				DisplayError(p_message);
			}
		}
		else if ($.inArray(m_data["champions"][pChamp]["championId"], m_data["constants"]["supp"]["primary"]) >=0 )
		{
			p_supp[((m_data["champions"][pChamp]["championLevel"])-1)].push(m_data["champions"][pChamp]["championId"]);
		}
		else if ($.inArray(m_data["champions"][pChamp]["championId"], m_data["constants"]["adc"]["primary"]) >=0 )
		{
			p_adc[((m_data["champions"][pChamp]["championLevel"])-1)].push(m_data["champions"][pChamp]["championId"]);
		}
		else 
			console.log ("FAILED BIG TIME: " + m_data["champions"][pChamp]["championId"]);
	}
		
	//store data
	m_data["stacked"] = Array();
	m_data["stacked"]["top"] = p_top;
	m_data["stacked"]["jg"] = p_jg;
	m_data["stacked"]["mid"] = p_mid;
	m_data["stacked"]["supp"] = p_supp;
	m_data["stacked"]["adc"] = p_adc;
	
	console.log ("data ready, creating stacked chart...");
		
	//ready for Charts: create them
	CreateStackedChart("primary", true);
	CreateDonutChart(m_data["selection"]["lane"], m_data["selection"]["group"], true);//changed
	CreateChampionsTable();
	CreateLaneGrades();
	GetRandomIconName(); //for background image
	
	$('#bar-intro>span').width("100%");
}

//calculates the grade for each lane, then inserts the images under the stacked chart
//also inserts data into the Summary Section
function CreateLaneGrades()
{
	var p_grades = Array();
	var p_gradesHTML = "";
	var p_overallGrade = "";
	var p_bestLaneGrade = "";
	var p_bestLane = "";
	var p_bestLaneScore = "";
	//temps
	var tempOverallPoints = 0;
	var tempLanePoints = 0;
	
	for (lane in m_data["stacked"])
	{
		var p_lanePoints = 0;
		var count = 0;
		
		for (var level=0; level<7; ++level)
		{
			for (champ in m_data["stacked"][lane][level])
			{				
				p_lanePoints += m_data["champions"][m_data["stacked"][lane][level][champ]]["championPoints"];
				count++;
			}
		}		
		//include the champions at Mastery lvl 0, bringing down the grade a bit
		count += m_data["constants"][lane]["primary"].length - count;
		//save best lane and grade 
		if (tempLanePoints < p_lanePoints/count)
		{
			p_bestLane = lane;
			p_bestLaneGrade = CalculateGrade(p_lanePoints/count);
			tempLanePoints = p_lanePoints/count;
		}
		p_grades[lane] = CalculateGrade(p_lanePoints/count);

		//used to create overall grade
		tempOverallPoints += (p_lanePoints/count);
	}
	//calculate overall grade
	p_overallGrade = CalculateGrade(tempOverallPoints/5);
	
	for (grade in p_grades)
		p_gradesHTML += "<img src='img/Grades/" + p_grades[grade] + ".png' class='grade'>";
	
	//calculate and store data
	p_bestLane_score = CalculateMasteryScore(p_bestLane, "primary", false);
	var masteryScore = CalculateMasteryScore("all", "primary", false);
	var totalNumberOfChampions = (CalculateMMSPL("all", "primary")/7);
	
	//insert grades under the stacked chart
	$('#grades-container').append(p_gradesHTML);
	
	//insert some data in Summary - Summoner Profile
	$('#profile-overall-grade').attr("src", "img/Grades/" + p_overallGrade+ ".png");
	$('#profile-best-lane-grade').attr("src", "img/Grades/" + p_bestLaneGrade+ ".png");
	$('#test-summary-profile div.test-3').text("Best Lane: " + (ConvertLaneToString(p_bestLane)).toUpperCase());
	$('#test-summary-profile #mastery-score').text(masteryScore);	
	$('#test-summary-profile #mastery-best-lane-score').text(p_bestLane_score);	
	$('#test-summary-profile #mastery-avg').text( Math.round((masteryScore/totalNumberOfChampions) * 10 ) / 10);	
	$('#test-summary-profile #mastery-best-lane-avg').text(Math.round((p_bestLane_score/m_data["constants"][p_bestLane]["primary"].length) *10) /10);	
	
	//insert data in Summary - Champions Mastered & Chests Earned
	//total
	$('#test-summary-champions #amount-total').text((m_data["stacked"]["top"][6].length + m_data["stacked"]["jg"][6].length +m_data["stacked"]["mid"][6].length +m_data["stacked"]["supp"][6].length +m_data["stacked"]["adc"][6].length) + "/" + (CalculateMMSPL("all", "primary")/7));
	$('#test-summary-champions #bar-total>span').width((((m_data["stacked"]["top"][6].length + m_data["stacked"]["jg"][6].length +m_data["stacked"]["mid"][6].length +m_data["stacked"]["supp"][6].length +m_data["stacked"]["adc"][6].length)/(CalculateMMSPL("all", "primary")/7)) * 100).toString() + "%");
	$('#test-summary-chests #amount-total').text(m_chestsEarned.length + "/" + (CalculateMMSPL("all", "primary")/7));
	$('#test-summary-chests #bar-total>span').width(((m_chestsEarned.length/(CalculateMMSPL("all", "primary")/7)) * 100).toString() + "%");
	//all other lanes
	for (pLane in m_data["stacked"])
	{
		$('#test-summary-champions #amount-'+ pLane).text(m_data["stacked"][pLane][6].length + "/" + m_data["constants"][pLane]["primary"].length);
		$('#test-summary-champions #bar-'+ pLane +'>span').width(((m_data["stacked"][pLane][6].length /m_data["constants"][pLane]["primary"].length ) * 100).toString() + "%");
		
		var chestCounter = 0;
		for (pChamp in m_chestsEarned)
		{
			if ($.inArray(m_chestsEarned[pChamp], m_data["constants"][pLane]["primary"]) >= 0)
				chestCounter++;
		}
		$('#test-summary-chests #amount-'+ pLane).text(chestCounter + "/" + m_data["constants"][pLane]["primary"].length);
		$('#test-summary-chests #bar-'+ pLane +'>span').width(((chestCounter /m_data["constants"][pLane]["primary"].length ) * 100).toString() + "%");
	}

}

//data for refreshes
function CalculateStackedData(level, group, numOfChampions)
{
	return [
			[
				"Top",
				CalculateMasteryScoreOrNumOfChampions("top", group, level, numOfChampions)
			],
			[
				"Jungle",
				CalculateMasteryScoreOrNumOfChampions("jg", group, level, numOfChampions)
			],
			[
				"Mid",
				CalculateMasteryScoreOrNumOfChampions("mid", group, level, numOfChampions)
			],
			[
				"Support",
				CalculateMasteryScoreOrNumOfChampions("supp", group, level, numOfChampions)
			],
			[
				"ADC",
				CalculateMasteryScoreOrNumOfChampions("adc", group, level, numOfChampions)
			]
		]
}

//data for refreshes
function CalculateDonutData(lane, group, numOfChampions)
{
	return [
			[
				"Mastery lvl 7",
				CalculateMasteryScoreOrNumOfChampions(lane, group, 7, numOfChampions)
			],
			[
				"Mastery lvl 6",
				CalculateMasteryScoreOrNumOfChampions(lane, group, 6, numOfChampions)
			],
			[
				"Mastery lvl 5",
				CalculateMasteryScoreOrNumOfChampions(lane, group, 5, numOfChampions)
			],
			[
				"Mastery lvl 4",
				CalculateMasteryScoreOrNumOfChampions(lane, group, 4, numOfChampions)
			],
			[
				"Mastery lvl 3",
				CalculateMasteryScoreOrNumOfChampions(lane, group, 3, numOfChampions)
			],
			[
				"Mastery lvl 2",
				CalculateMasteryScoreOrNumOfChampions(lane, group, 2, numOfChampions)
			],
			[
				"Mastery lvl 1",
				CalculateMasteryScoreOrNumOfChampions(lane, group, 1, numOfChampions)
			],
			[
				"No Mastery",
				CalculateMasteryScoreOrNumOfChampions(lane, group, 0, numOfChampions)
			]
		]
}

//Setup stacked column chart. numOfChampions(-false: displays mastery score distribution; -true: displays # of champions)
function GetStackedChartOptions(group, numOfChampions)
{
	var options = {
		"chart": {
			"type": "column",
			"backgroundColor": "RGBA(255,255,255,0)",
			"borderRadius": 14
		},
		"plotOptions": {
			"series": {
				"stacking": "normal"
			}
		},
		"colors": [
			"#7cb5ec",
			"#434348",
			"#90ed7d",
			"#f7a35c",
			"#a0f390",
			"#f15c80",
			"#e4d354",
			"#2b908f",
			"#f45b5b",
			"#91e8e1"
		],
		"xAxis": {
			"title": {
				"style": {
					"fontSize": "28px"
				},
				"text": null
			},
			"type": "category"
		},
		"yAxis": {
			"title": {
				"style": {
					"fontSize": "16px",
					"word-spacing": "6px"
				},
				"text": null
			},
			"type": "linear"
		},
		"title": {
			"text": "Mastery Distribution per Lane",
		},
		"credits": {
			"enabled": false
		},
		"legend": {
			"align": "right",
			"verticalAlign": "middle",
			"layout": "vertical",
			"itemDistance": 5,
		    "itemMarginTop": 2,
		    "itemMarginBottom": 2
		},
	/*	tooltip: {
			borderWidth: 3,
            headerFormat: '<span style="text-decoration: underline;"><b>{point.key}</b></span><br/>',
            pointFormat: '<b>{series.name}: </b></span>{point.y} pts<br/><b>Total: </b>{point.stackTotal} pts'
        },*/
		tooltip: {
			formatter: function() {
				var s = '';//'<b>'+ this.key +'</b>';
				var total = 0;
				
				$.each(this.points, function(i, point) {
					if (i === 0)
						s += '<span style="font-size: 14px; font-weight: bold; text-decoration: underline; color: white;">'+ point.key +'</span><br>';
					s += '<br/><span style="font-weight: bold; color: ' + point.series.color + ';text-shadow: 0 0 2px black">' + point.series.name +': </span><span style="font-weight: bold; color: white">' + point.y + ' champs</span>';
					total += point.y;
				});
				s += '<br/><span style="color: white">_____________________</span><br/><span style="font-weight: bold; color: white">Total: ' + total + ' champs</span>';
				return s;
			},
			shape: "callout",
			shared: true,
			borderWidth: 3,
			backgroundColor: "#242b31",
			borderColor: "#54AF97"
		},
		"series": [
			{
				"index": 0,
				"color": "#f46666",
				"name": "Mastery lvl 1",
				"data": [
					[
						"Top",
						CalculateMasteryScoreOrNumOfChampions("top", group, 1, numOfChampions)
					],
					[
						"Jungle",
						CalculateMasteryScoreOrNumOfChampions("jg", group, 1, numOfChampions)
					],
					[
						"Mid",
						CalculateMasteryScoreOrNumOfChampions("mid", group, 1, numOfChampions)
					],
					[
						"Support",
						CalculateMasteryScoreOrNumOfChampions("supp", group, 1, numOfChampions)
					],
					[
						"ADC",
						CalculateMasteryScoreOrNumOfChampions("adc", group, 1, numOfChampions)
					]
				]
			},
			{
				"index": 1,
				"color": "#ffb065",
				"name": "Mastery lvl 2",
				"data": [
					[
						"Top",
						CalculateMasteryScoreOrNumOfChampions("top", group, 2, numOfChampions)
					],
					[
						"Jungle",
						CalculateMasteryScoreOrNumOfChampions("jg", group, 2, numOfChampions)
					],
					[
						"Mid",
						CalculateMasteryScoreOrNumOfChampions("mid", group, 2, numOfChampions)
					],
					[
						"Support",
						CalculateMasteryScoreOrNumOfChampions("supp", group, 2, numOfChampions)
					],
					[
						"ADC",
						CalculateMasteryScoreOrNumOfChampions("adc", group, 2, numOfChampions)
					]
				]
			},
			{
				"color": "#f8f470",
				"index": 2,
				"name": "Mastery lvl 3",
				"data": [
					[
						"Top",
						CalculateMasteryScoreOrNumOfChampions("top", group, 3, numOfChampions)
					],
					[
						"Jungle",
						CalculateMasteryScoreOrNumOfChampions("jg", group, 3, numOfChampions)
					],
					[
						"Mid",
						CalculateMasteryScoreOrNumOfChampions("mid", group, 3, numOfChampions)
					],
					[
						"Support",
						CalculateMasteryScoreOrNumOfChampions("supp", group, 3, numOfChampions)
					],
					[
						"ADC",
						CalculateMasteryScoreOrNumOfChampions("adc", group, 3, numOfChampions)
					]
				]
			},
			{
				"color": "#bfe562",
				"index": 3,
				"name": "Mastery lvl 4",
				"data": [
					[
						"Top",
						CalculateMasteryScoreOrNumOfChampions("top", group, 4, numOfChampions)
					],
					[
						"Jungle",
						CalculateMasteryScoreOrNumOfChampions("jg", group, 4, numOfChampions)
					],
					[
						"Mid",
						CalculateMasteryScoreOrNumOfChampions("mid", group, 4, numOfChampions)
					],
					[
						"Support",
						CalculateMasteryScoreOrNumOfChampions("supp", group, 4, numOfChampions)
					],
					[
						"ADC",
						CalculateMasteryScoreOrNumOfChampions("adc", group, 4, numOfChampions)
					]
				]
			},
			{
				"color": "#90ed7d",
				"index": 4,
				"name": "Mastery lvl 5",
				"data": [
					[
						"Top",
						CalculateMasteryScoreOrNumOfChampions("top", group, 5, numOfChampions)
					],
					[
						"Jungle",
						CalculateMasteryScoreOrNumOfChampions("jg", group, 5, numOfChampions)
					],
					[
						"Mid",
						CalculateMasteryScoreOrNumOfChampions("mid", group, 5, numOfChampions)
					],
					[
						"Support",
						CalculateMasteryScoreOrNumOfChampions("supp", group, 5, numOfChampions)
					],
					[
						"ADC",
						CalculateMasteryScoreOrNumOfChampions("adc", group, 5, numOfChampions)
					]
				]
			},
			{
				"color": "#C879D1",
				"index": 5,
				"name": "Mastery lvl 6",
				"data": [
					[
						"Top",
						CalculateMasteryScoreOrNumOfChampions("top", group, 6, numOfChampions)
					],
					[
						"Jungle",
						CalculateMasteryScoreOrNumOfChampions("jg", group, 6, numOfChampions)
					],
					[
						"Mid",
						CalculateMasteryScoreOrNumOfChampions("mid", group, 6, numOfChampions)
					],
					[
						"Support",
						CalculateMasteryScoreOrNumOfChampions("supp", group, 6, numOfChampions)
					],
					[
						"ADC",
						CalculateMasteryScoreOrNumOfChampions("adc", group, 6, numOfChampions)
					]
				]
			},
			{
				"color": "#4DD0BA",
				"index": 6,
				"name": "Mastery lvl 7",
				"data": [
					[
						"Top",
						CalculateMasteryScoreOrNumOfChampions("top", group, 7, numOfChampions)
					],
					[
						"Jungle",
						CalculateMasteryScoreOrNumOfChampions("jg", group, 7, numOfChampions)
					],
					[
						"Mid",
						CalculateMasteryScoreOrNumOfChampions("mid", group, 7, numOfChampions)
					],
					[
						"Support",
						CalculateMasteryScoreOrNumOfChampions("supp", group, 7, numOfChampions)
					],
					[
						"ADC",
						CalculateMasteryScoreOrNumOfChampions("adc", group, 7, numOfChampions)
					]
				]
			}
		]
	};
	
	return options;
}

//Setup donut chart
function GetDonutChartOptions(lane, group, numOfChampions)
{
	var options = {
		"chart": {
			"type": "pie",
			"borderColor": "#0b5dbd",
			"backgroundColor": "rgba(255, 255, 255, 0)",
			"style": {
				"fontFamily": "Quicksand"
			}
		},
		"plotOptions": {
			"pie": {
				"allowPointSelect": true,
				"cursor": true,
				"showInLegend": true,
				"innerSize": "60%"
			}
		},
		tooltip: {
			formatter: function() {
				var s = '<span style="font-size: 14px; font-weight: bold; text-decoration: underline; color: ' + this.color + ';">'+ this.key +'</span>';				
				s += '<br/><span style="font-weight: bold; color: white">' + this.y + ' champs</span>';
				return s;
			},
			shape: "callout", 
			borderWidth: 3,
			backgroundColor: "#242b31",
			borderColor: "#54AF97"
		},
		"colors": [
			"#7cb5ec",
			"#434348",
			"#90ed7d",
			"#ffb065",
			"#8085e9",
			"#b5b5b5",
			"#f8f470",
			"#2b908f",
			"#f46666",
			"#91e8e1"
		],
		"title": {
			"text": "Champion's Mastery: All Lanes",
		},
		"credits": {
			"enabled": false
		},
		"legend": {
			"enabled": false,
			"layout": "vertical"
		},
		"series": [
			{
				"index": 0,
				"colors": [
					"#4DD0BA",
					"#C879D1",
					"#90ed7d",
					"#bfe562",
					"#f8f470",
					"#ffb065",
					"#f46666",
					"#848b8b",
					"#90ed7d",
					"#2b908f",
					"#f46666",
					"#91e8e1"
					],
				"name": "Champions",
				"data": CalculateDonutData(lane, group, numOfChampions),
				"point":{
						"events":{
							"click" : function(){
											var p_selectedPoints = m_donutChart.getSelectedPoints();
											if (p_selectedPoints.length > 0)	//if there's a slice selected
											{
												var p_level;
												var p_selectedPoint = p_selectedPoints[0];

												//convert this selected point to its corresponding mastery lvl (grab total points -1 (always 5), subtract this point's index)
												p_level = ((m_donutChart.series[0].data.length-1)-this.x);
												
												if (p_level.toString() === m_data["selection"]["level"]) //if mastery lvl of one user clicked matches the last input, just deselect it
												{
													m_data["selection"]["level"] = "-1";
												}
												else //selected a new one
												{
													m_data["selection"]["level"] = p_level.toString();
												}
											}
											else	//if not selected
											{
												var p_level = ((m_donutChart.series[0].data.length-1)-this.x);

												m_data["selection"]["level"] = p_level.toString();
											}
											
											//scroll to show table
											if (m_scrolledOnce === false)
											{
												$('#donutChart').scrollView();
												m_scrolledOnce = true;
											}
											
											RefreshChampionsTable();
									}
								}
						},
				"dataLabels": {
					verticalAlign: 'top',
					enabled: true,
					color: '#000000',
					connectorWidth: 1,
					style:{
						"fontSize": "12px"
						},
					distance: -32,
					connectorColor: '#000000',
					formatter: function () {
						var p_temp = "";
						if (this.y >= 1)
							p_temp = Math.round(this.percentage) + "%";
						return p_temp;
					}
				}
			}
		]
	}
	return options;	
}

//------------------------------------------------------------------------------------------------------
//create sections
//------------------------------------------------------------------------------------------------------
function CreateStackedChart(group, numOfChampions)
{
	m_stackedChart = new Highcharts.Chart("stackedChart", GetStackedChartOptions(group, numOfChampions));
	
	//modify css
	$(".highcharts-axis-labels text").css({'fill': '#3A6B77', 'color': '#3A6B77'} );
}

function CreateDonutChart(lane, group, numOfChampions)
{
	m_donutChart = new Highcharts.Chart("donutChart", GetDonutChartOptions(lane, group, numOfChampions));
}

function CreateChampionsTable()
{
	var p_data = Array();
		
	//put data in new array
	for (champion in m_data["champions"])
	{
		var p_champ = Array();
		p_champ = [
			"<img class='champ-icon' src='http://ddragon.leagueoflegends.com/cdn/" + m_patch + "/img/champion/" + m_data["constants"]["map"][m_data["champions"][champion]["championId"]]["icon"] + ".png'/>",
			m_data["constants"]["map"][m_data["champions"][champion]["championId"]]["name"],
			(m_data["champions"][champion]["chestGranted"] === true ? "<img id='chest' src='img/chest.png'/>" : "<img id='chest' src='img/chest.png' class='chest-not-earned'/>"),
			CalculateGrade(m_data["champions"][champion]["championPoints"]),
			m_data["champions"][champion]["championLevel"],
			m_data["champions"][champion]["championPoints"],
			((m_data["champions"][champion]["championPointsUntilNextLevel"] === 0 && m_data["champions"][champion]["championLevel"] < 7) ? (m_data["champions"][champion]["championLevel"]-3-m_data["champions"][champion]["tokensEarned"] + " token(s)") : m_data["champions"][champion]["championPointsUntilNextLevel"]) + " <div class='meter' id='mastery-"+m_data["champions"][champion]["championLevel"]+"'><span style='width: " + ((m_data["champions"][champion]["championPoints"]/(m_data["champions"][champion]["championPoints"] + m_data["champions"][champion]["championPointsUntilNextLevel"])) * 100) + "%'></span></div>"
			
			
		];
		p_data.push(p_champ);
	}
	
	//create table
	m_championsTable = $('#champions-table').DataTable( {
        data: p_data,
		order: [[ 5, "asc" ]],
        columns: [
            { title: "Icon", "iDataSort": 1 },
            { title: "Name" },
            { title: "Chest", "sType": "chest-earned" },
            { title: "Grade", "sType": "grade" },
            { title: "Level" , "sType": "invert" },
            { title: "Pts" , "sType": "invert" },
            { title: "Pts to Next lvl" , "sType": "progress" }
        ]
    } );
}

//------------------------------------------------------------------------------------------------------
//refresh sections
//------------------------------------------------------------------------------------------------------
function RefreshDonutChart()
{
	m_donutChart.series[0].setData(CalculateDonutData(m_data["selection"]["lane"], m_data["selection"]["group"], true), true);
}

function RefreshChampionsTable()
{
	var p_data = Array();
	var p_currSelectedLane = m_data["selection"]["lane"];
	var p_currSelectedLevel = Number(m_data["selection"]["level"]);
	var p_currSelectedGroup = m_data["selection"]["group"];
	
	//clear table
	m_championsTable.clear();
							
	//put data in new array
	if (p_currSelectedLane === "all")	//display all champions if no lanes are selected
	{
		//if a mastery level is specified
		if (p_currSelectedLevel > 0)
		{
			for (lane in m_data["stacked"])
			{
				for (champ in m_data["stacked"][lane][p_currSelectedLevel-1])
				{
					var p_champ = Array();
					
					p_champ = [
						"<img class='champ-icon' src='http://ddragon.leagueoflegends.com/cdn/" + m_patch + "/img/champion/" + m_data["constants"]["map"][m_data["stacked"][lane][p_currSelectedLevel-1][champ]]["icon"] + ".png'/>",
						m_data["constants"]["map"][m_data["stacked"][lane][p_currSelectedLevel-1][champ]]["name"],
						(m_data["champions"][m_data["stacked"][lane][p_currSelectedLevel-1][champ]]["chestGranted"] === true ? "<img id='chest' src='img/chest.png'/>" : "<img id='chest' src='img/chest.png' class='chest-not-earned'/>"),
						CalculateGrade(m_data["champions"][m_data["stacked"][lane][p_currSelectedLevel-1][champ]]["championPoints"]),
						m_data["champions"][m_data["stacked"][lane][p_currSelectedLevel-1][champ]]["championLevel"],
						m_data["champions"][m_data["stacked"][lane][p_currSelectedLevel-1][champ]]["championPoints"],
						((m_data["champions"][m_data["stacked"][lane][p_currSelectedLevel-1][champ]]["championPointsUntilNextLevel"] === 0 && m_data["champions"][m_data["stacked"][lane][p_currSelectedLevel-1][champ]]["championLevel"] < 7) ? (m_data["champions"][m_data["stacked"][lane][p_currSelectedLevel-1][champ]]["championLevel"]-3-m_data["champions"][m_data["stacked"][lane][p_currSelectedLevel-1][champ]]["tokensEarned"] + " token(s)") : m_data["champions"][m_data["stacked"][lane][p_currSelectedLevel-1][champ]]["championPointsUntilNextLevel"]) + " <div class='meter' id='mastery-"+m_data["champions"][m_data["stacked"][lane][p_currSelectedLevel-1][champ]]["championLevel"]+"'><span style='width: " + ((m_data["champions"][m_data["stacked"][lane][p_currSelectedLevel-1][champ]]["championPoints"]/(m_data["champions"][m_data["stacked"][lane][p_currSelectedLevel-1][champ]]["championPoints"] + m_data["champions"][m_data["stacked"][lane][p_currSelectedLevel-1][champ]]["championPointsUntilNextLevel"])) * 100) + "%'></span></div>"
					];
										
					p_data.push(p_champ);
				}
			}
		}
		else if (p_currSelectedLevel === 0)	//no mastery 
		{	
			for (lane in m_data["stacked"])
			{
				//console.log(m_data["champions"]);
				for (pChamp in m_data["constants"][lane][p_currSelectedGroup])
				{
					
					//add champion if it's not in the list
					if (m_data["champions"][m_data["constants"][lane][p_currSelectedGroup][pChamp]] != undefined )
					{
					}
					else
					{
						var p_champ = Array();
	
						p_champ = [
							"<img class='champ-icon' src='http://ddragon.leagueoflegends.com/cdn/" + m_patch + "/img/champion/" + m_data["constants"]["map"][m_data["constants"][lane][p_currSelectedGroup][pChamp]]["icon"] + ".png'/>",
							m_data["constants"]["map"][m_data["constants"][lane][p_currSelectedGroup][pChamp]]["name"],
							"<img id='chest' src='img/chest.png' class='chest-not-earned'/>",
							"F",
							0,
							0,
							1 + " <div class='meter'><span style='width: 0%'></span></div>"
						];
								
						p_data.push(p_champ);
					}
				}
			}
		}
		else	//if -1 level
		{
			for (champion in m_data["champions"])
			{
				var p_champ = Array();
				p_champ = [
					"<img class='champ-icon' src='http://ddragon.leagueoflegends.com/cdn/" + m_patch + "/img/champion/" + m_data["constants"]["map"][m_data["champions"][champion]["championId"]]["icon"] + ".png'/>",
					m_data["constants"]["map"][m_data["champions"][champion]["championId"]]["name"],
					(m_data["champions"][champion]["chestGranted"] === true ? "<img id='chest' src='img/chest.png'/>" : "<img id='chest' src='img/chest.png' class='chest-not-earned'/>"),
					CalculateGrade(m_data["champions"][champion]["championPoints"]),
					m_data["champions"][champion]["championLevel"],
					m_data["champions"][champion]["championPoints"],
					((m_data["champions"][champion]["championPointsUntilNextLevel"] === 0 && m_data["champions"][champion]["championLevel"] < 7) ? (m_data["champions"][champion]["championLevel"]-3-m_data["champions"][champion]["tokensEarned"] + " token(s)") : m_data["champions"][champion]["championPointsUntilNextLevel"]) + " <div class='meter' id='mastery-"+m_data["champions"][champion]["championLevel"]+"'><span style='width: " + ((m_data["champions"][champion]["championPoints"]/(m_data["champions"][champion]["championPoints"] + m_data["champions"][champion]["championPointsUntilNextLevel"])) * 100) + "%'></span></div>"
				];
				p_data.push(p_champ);
			}
		}
	}
	else	//if a regular lane was selected, display all champions in that lane
	{
		if (p_currSelectedLevel > 0)
		{
			for (champ in m_data["stacked"][p_currSelectedLane][p_currSelectedLevel-1])
			{
				var p_champ = Array();
				
				p_champ = [
					"<img class='champ-icon' src='http://ddragon.leagueoflegends.com/cdn/" + m_patch + "/img/champion/" + m_data["constants"]["map"][m_data["stacked"][p_currSelectedLane][p_currSelectedLevel-1][champ]]["icon"] + ".png'/>",
					m_data["constants"]["map"][m_data["stacked"][p_currSelectedLane][p_currSelectedLevel-1][champ]]["name"],
					(m_data["champions"][m_data["stacked"][p_currSelectedLane][p_currSelectedLevel-1][champ]]["chestGranted"] === true ? "<img id='chest' src='img/chest.png'/>" : "<img id='chest' src='img/chest.png' class='chest-not-earned'/>"),
					CalculateGrade(m_data["champions"][m_data["stacked"][p_currSelectedLane][p_currSelectedLevel-1][champ]]["championPoints"]),
					m_data["champions"][m_data["stacked"][p_currSelectedLane][p_currSelectedLevel-1][champ]]["championLevel"],
					m_data["champions"][m_data["stacked"][p_currSelectedLane][p_currSelectedLevel-1][champ]]["championPoints"],
					((m_data["champions"][m_data["stacked"][p_currSelectedLane][p_currSelectedLevel-1][champ]]["championPointsUntilNextLevel"] === 0 && m_data["champions"][m_data["stacked"][p_currSelectedLane][p_currSelectedLevel-1][champ]]["championLevel"] < 7) ? (m_data["champions"][m_data["stacked"][p_currSelectedLane][p_currSelectedLevel-1][champ]]["championLevel"]-3-m_data["champions"][m_data["stacked"][p_currSelectedLane][p_currSelectedLevel-1][champ]]["tokensEarned"] + " token(s)") : m_data["champions"][m_data["stacked"][p_currSelectedLane][p_currSelectedLevel-1][champ]]["championPointsUntilNextLevel"]) + " <div class='meter' id='mastery-"+m_data["champions"][m_data["stacked"][p_currSelectedLane][p_currSelectedLevel-1][champ]]["championLevel"]+"'><span style='width: " + ((m_data["champions"][m_data["stacked"][p_currSelectedLane][p_currSelectedLevel-1][champ]]["championPoints"]/(m_data["champions"][m_data["stacked"][p_currSelectedLane][p_currSelectedLevel-1][champ]]["championPoints"] + m_data["champions"][m_data["stacked"][p_currSelectedLane][p_currSelectedLevel-1][champ]]["championPointsUntilNextLevel"])) * 100) + "%'></span></div>"
					
					
				];
	
				p_data.push(p_champ);
			}
		}
		else if (p_currSelectedLevel === 0)	//no mastery 
		{
			for (pChamp in m_data["constants"][p_currSelectedLane][p_currSelectedGroup])
			{
				
				//add champion if it's not in the list
				if (m_data["champions"][m_data["constants"][p_currSelectedLane][p_currSelectedGroup][pChamp]] != undefined )
				{
				}
				else
				{
					var p_champ = Array();

					p_champ = [
						"<img class='champ-icon' src='http://ddragon.leagueoflegends.com/cdn/" + m_patch + "/img/champion/" + m_data["constants"]["map"][m_data["constants"][p_currSelectedLane][p_currSelectedGroup][pChamp]]["icon"] + ".png'/>",
						m_data["constants"]["map"][m_data["constants"][p_currSelectedLane][p_currSelectedGroup][pChamp]]["name"],
						"<img id='chest' src='img/chest.png' class='chest-not-earned'/>",
						"F",
						0,
						0,
						1 + " <div class='meter'><span style='width: 0%'></span></div>"
					];
							
					p_data.push(p_champ);
				}
			}
		}
		else	//all levels
		{
			for (var level=0; level<7; ++level)
			{
				for (champ in m_data["stacked"][p_currSelectedLane][level])
				{
					var p_champ = Array();
					
					p_champ = [
						"<img class='champ-icon' src='http://ddragon.leagueoflegends.com/cdn/" + m_patch + "/img/champion/" + m_data["constants"]["map"][m_data["stacked"][p_currSelectedLane][level][champ]]["icon"] + ".png'/>",
						m_data["constants"]["map"][m_data["stacked"][p_currSelectedLane][level][champ]]["name"],
						(m_data["champions"][m_data["stacked"][p_currSelectedLane][level][champ]]["chestGranted"] === true ? "<img id='chest' src='img/chest.png'/>" : "<img id='chest' src='img/chest.png' class='chest-not-earned'/>"),
						CalculateGrade(m_data["champions"][m_data["stacked"][p_currSelectedLane][level][champ]]["championPoints"]),
						m_data["champions"][m_data["stacked"][p_currSelectedLane][level][champ]]["championLevel"],
						m_data["champions"][m_data["stacked"][p_currSelectedLane][level][champ]]["championPoints"],
						((m_data["champions"][m_data["stacked"][p_currSelectedLane][level][champ]]["championPointsUntilNextLevel"] === 0 && m_data["champions"][m_data["stacked"][p_currSelectedLane][level][champ]]["championLevel"] < 7) ? (m_data["champions"][m_data["stacked"][p_currSelectedLane][level][champ]]["championLevel"]-3-m_data["champions"][m_data["stacked"][p_currSelectedLane][level][champ]]["tokensEarned"] + " token(s)") : m_data["champions"][m_data["stacked"][p_currSelectedLane][level][champ]]["championPointsUntilNextLevel"]) + " <div class='meter' id='mastery-"+m_data["champions"][m_data["stacked"][p_currSelectedLane][level][champ]]["championLevel"]+"'><span style='width: " + ((m_data["champions"][m_data["stacked"][p_currSelectedLane][level][champ]]["championPoints"]/(m_data["champions"][m_data["stacked"][p_currSelectedLane][level][champ]]["championPoints"] + m_data["champions"][m_data["stacked"][p_currSelectedLane][level][champ]]["championPointsUntilNextLevel"])) * 100) + "%'></span></div>"
					];
							
					p_data.push(p_champ);
				}
			}
		}
	}
	
	//add data and redraw
	m_championsTable.rows.add(p_data);
	m_championsTable.draw();
}
//------------------------------------------------------------------------------------------------------
//	JQUERY - CLICK EVENTS
//------------------------------------------------------------------------------------------------------
//stacked - click event (selects a column, aka lane)
$(document).on('click','div#stackedChart>div>svg>g>g>rect',function()
{
	var p_xVal = $(this).css("x");
	var rects = Array();
	var pSelected = false;
	
	//scroll to show table
	//$('#donutChart').scrollView();

	$('div#stackedChart>div>svg>g>g>rect').each(function( index ) {
	  	if ($(this).css("x") === p_xVal)
		{
			pSelected = $(this).hasClass('stacked-lane-selected');
			rects.push($(this));	
		}
	});	
	
	if (pSelected === true)	//unclicked the selected lane
	{
		for (var i=0; i<rects.length; ++i)
			rects[i].toggleClass('stacked-lane-selected');	
			
		//reset title to say "All Lanes", and reset xAxis text on the bottom (lanes)
		$('#donutChart text.highcharts-title>tspan').text("Champion's Mastery: All Lanes")
		$(".highcharts-axis-labels text").css({'fill': '#3A6B77', 'color': '#3A6B77'} );

		//change our 'selection data', then pass it to the donut-chart-refresh and champions-table-refresh function
		m_data["selection"]["lane"] = "all";
		m_data["selection"]["level"] = "-1";
	}
	else //clicked on a new lane
	{
		//reset xAxis text on the bottom (lanes)
		$(".highcharts-axis-labels text").css({'fill': '#3A6B77', 'color': '#3A6B77'} );
		//remove any selection 
		$("div#stackedChart>div>svg>g>g>rect").removeClass('stacked-lane-selected');
		for (var i=0; i<rects.length; ++i)
			rects[i].toggleClass('stacked-lane-selected');	
		
		//get lane string to pass to donut chart
		var pLane = $('div#stackedChart>div>svg>g.highcharts-xaxis-labels').children().eq(rects[0].index()).text();
		$('div#stackedChart>div>svg>g.highcharts-xaxis-labels').children().eq(rects[0].index()).css({"fill": "#87DDC6", 'color': '#87DDC6', "text-decoration": "underline"} );

		//change title to specify which lane we're seeing in details
		$('#donutChart text.highcharts-title>tspan').text("Champion's Mastery: " + pLane)
				
		//change our 'selection data', then pass it to the donut-chart-refresh and champions-table-refresh function
		m_data["selection"]["lane"] = ConvertStringToLane(pLane);
		m_data["selection"]["level"] = "-1";
	}
	
		//reset donut's selected slices	
		var p_selectedPoints = m_donutChart.getSelectedPoints();
		if (p_selectedPoints.length > 0)
			for (point in p_selectedPoints)
				p_selectedPoints[point].select();

		RefreshDonutChart();
		RefreshChampionsTable();
});

//scroll to HTML element (jQuery extension)
$.fn.scrollView = function ()
{
    return this.each(function () {
        $('html, body').animate({
            scrollTop: $(this).offset().top
        }, 1000);
    });
}

//------------------------------------------------------------------------------------------------------
//	DATA TABLE: CUSTOM SORTING
//------------------------------------------------------------------------------------------------------
//chests earned
jQuery.fn.dataTableExt.oSort['chest-earned-asc']  = function(a,b) {
	var a_sort = Number($(a).hasClass('chest-not-earned'));
	var b_sort =  Number($(b).hasClass('chest-not-earned'));
	return ((a_sort < b_sort) ? -1 : ((a_sort > b_sort) ?  1 : 0));
};
jQuery.fn.dataTableExt.oSort['chest-earned-desc'] = function(a,b) {
	var a_sort = Number($(a).hasClass('chest-not-earned'));
	var b_sort =  Number($(b).hasClass('chest-not-earned'));
	return ((a_sort < b_sort) ?  1 : ((a_sort > b_sort) ? -1 : 0));
};
//grades
jQuery.fn.dataTableExt.oSort['grade-asc'] = function(a,b) {
	var a_sort = ConvertGradeToNumber(a);
	var b_sort =  ConvertGradeToNumber(b);
	return ((a_sort < b_sort) ?  1 : ((a_sort > b_sort) ? -1 : 0));
};
jQuery.fn.dataTableExt.oSort['grade-desc']  = function(a,b) {
	var a_sort = ConvertGradeToNumber(a);
	var b_sort =  ConvertGradeToNumber(b);
	return ((a_sort < b_sort) ? -1 : ((a_sort > b_sort) ?  1 : 0));
};
//inverts desc with asc (for consistency/intuitive purposes)
jQuery.fn.dataTableExt.oSort['invert-asc'] = function(a,b) {
	return ((a < b) ?  1 : ((a > b) ? -1 : 0));
};
jQuery.fn.dataTableExt.oSort['invert-desc']  = function(a,b) {
	return ((a < b) ? -1 : ((a > b) ?  1 : 0));
};
//progress bars
jQuery.fn.dataTableExt.oSort['progress-asc']  = function(a,b) {
	var a_sort = (parseInt(a.split("<")[0]) === 0 ) ? 500000 : parseInt(a.split("<")[0]);
	var b_sort = (parseInt(b.split("<")[0]) === 0 ) ? 500000 : parseInt(b.split("<")[0]);
	return ((a_sort < b_sort) ? -1 : ((a_sort > b_sort) ?  1 : 0));
};
jQuery.fn.dataTableExt.oSort['progress-desc'] = function(a,b) {
	var a_sort = (parseInt(a.split("<")[0]) === 0 ) ? 500000 : parseInt(a.split("<")[0]);
	var b_sort = (parseInt(b.split("<")[0]) === 0 ) ? 500000 : parseInt(b.split("<")[0]);
	return ((a_sort < b_sort) ?  1 : ((a_sort > b_sort) ? -1 : 0));
};


/* Toggle Button Event - Toggle b/w Mastery Score And # of Champions
$(document).on('click','#toggle-masteryScore-numOfChampions', function(){
	console.log ("clicked button");
	m_stackedChart.series[0].setData(CalculateStackedData(1, m_data["selection"]["group"], m_bool_masteryOrNumberOfChampions), false);
	m_stackedChart.series[1].setData(CalculateStackedData(2, m_data["selection"]["group"], m_bool_masteryOrNumberOfChampions), false);
	m_stackedChart.series[2].setData(CalculateStackedData(3, m_data["selection"]["group"], m_bool_masteryOrNumberOfChampions), false);
	m_stackedChart.series[3].setData(CalculateStackedData(4, m_data["selection"]["group"], m_bool_masteryOrNumberOfChampions), false);
	m_stackedChart.series[4].setData(CalculateStackedData(5, m_data["selection"]["group"], m_bool_masteryOrNumberOfChampions), true);
	m_donutChart.series[0].setData(CalculateDonutData(m_data["selection"]["lane"], m_data["selection"]["group"], m_bool_masteryOrNumberOfChampions), true);
	m_bool_masteryOrNumberOfChampions = !m_bool_masteryOrNumberOfChampions;
});
*/

//TEMP: click to delete part of the table
/*
$(document).on('click','body',function(){
	
	var indexes = m_championsTable.rows().eq(0).filter(function(index) {
		console.log ("index: " + index + " -- value: " + m_championsTable.cell( index, 4 ).data());
		return m_championsTable.cell( index, 4 ).data() > 3 ? true : false;
	});
	
	m_championsTable.rows(indexes).remove();
	m_championsTable.draw();
	console.log ("changed table!");
});
*/