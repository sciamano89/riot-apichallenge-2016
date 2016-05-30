<?php
	//--------------------------------------------------------------------------------------------------------------
	//Author: 		Raimondo Previdi
	//File name:	api-caller.php
	//Date:			4/25/2016
	//Info:			Communicates directly with Riot's API whenever the site needs an API key
	//--------------------------------------------------------------------------------------------------------------
		
	//get private credentials
	require_once '../private/app_config.php';

	//constants
	$m_regions = ["na", "br", "eune", "euw", "jp", "kr", "lan", "las", "oce", "ru", "tr"];

	//variables
	$m_stringToSend = "";
	$error = false;
	$region = "";
	
	//main
	$m_operation = $_GET['op'];
	
	switch($m_operation)
	{
		case 1: //get SummonerId
			$region = $_GET['region'];
			$summonerName = rawurlencode($_GET['name']);
			if (isset($summonerName) === false || isset($region) === false)
			{
				$error = true;	
			}
			$m_stringToSend = "https://" .$region. ".api.pvp.net/api/lol/" .$region. "/v1.4/summoner/by-name/" .$summonerName. "?api_key=" .API_KEY;
			break;
		case 2: //get champions' mastery data
			$region = $_GET['region'];
			$platformId = $_GET['platformId'];
			$summonerId = $_GET['summonerId'];
			if (isset($platformId) === false || isset($summonerId) === false || isset($region) === false)
			{
				$error = true;	
			}
			$m_stringToSend = "https://" .$region. ".api.pvp.net/championmastery/location/" .$platformId. "/player/" .$summonerId. "/champions?api_key=" .API_KEY;
			break;
		case 3:
			$region = $_GET['region'];
			$summonerId = $_GET['summonerId'];
			if (isset($summonerId) === false || isset($region) === false)
			{
				$error = true;	
			}
			$m_stringToSend = "https://" .$region. ".api.pvp.net/api/lol/" .$region. "/v2.5/league/by-summoner/" .$summonerId. "/entry?api_key=" .API_KEY;
			break;
		default:
			echo "Invalid URL. Please use the section above to provide a Summoner Name and a Region.";
			break;
	}
	
	//check if there were any errors in the passed URL arguments (if user wrote them manunally)
	if ($error === true)
	{
		echo "Invalid URL. Please use the section above to provide a Summoner Name and a Region.";
	}
	else //grab and decode JSON
	{
		
		if (!$jsondata = @file_get_contents($m_stringToSend))
		{
			//special error-check case (if region was typed in wrong manually, the URL won't work at all, so we would not receive a response header)
			if(in_array($region, $m_regions) === false)
				echo 'Invalid URL. Please use the section above to provide a Summoner Name and a Region.';
			else
			{
				if (strpos($http_response_header[0], '404') !== FALSE) 
				{
					if ($m_operation == 3)
						echo 'Unranked';
					else
						echo 'Summoner not found in the selected Region.';
				}	
				else if (strpos($http_response_header[0], '403') !== FALSE || strpos($http_response_header[0], '400') !== FALSE) 
				{
					echo 'Invalid URL. Please use the section above to provide a Summoner Name and a Region.';
				}
				else
				{
					echo "Either you lost your internet connection or the server is busy :( Please try again in a little bit.";
				}
			}
		}
		else
		{
			echo $jsondata;
			$decodedData = json_decode($jsondata, true);
		}
	}
?>