//Making an interactive version of the HRW data
var hrwtable;
var hrweventList = [];
var activeHrwEventList = [];
var datePeriodTable;
var datePeriodList = [];
var siteIdHeaderList = [];
var siteIdTotalsCntList = [];
var siteIdActiveCntList = [];
var eventsPerDayList = [];
var dateHeadersTable;
var dateHeadersList = [];
var maxDtNum = 672;

//-----------Global Canvas Width and Height---------------
var scaleCanvas = 1;
var canvaswidth = 1200*scaleCanvas;
var canvasheight = 700*scaleCanvas;
var mapwidth = 740;
var mapheight = 542;
var mapOffsetY =75;
// var mapheight = 542.0/760.0*canvasheight;
var dtPeriodCoordX = 10;
var dtPeriodCoordY = canvasheight/4;
var dtPeriodWidth = canvaswidth/2;

//-----------Global UN Resolution Variables---------------
var resolutionDay = 22;
var resolutionMonth = 2;
var resolutionYear = 14;
var resolutionDt = 114;

//---------Global image variables---------
var underlayH = 542;
var long1 = 37.0755910328;
var long2 = 37.270195015;
var lat1 = 36.2616902128;
var lat2 = 36.1192872988;
var mapSizeM = 0.0;
var initialMap;
var roadUnderlay;

//------------Global color variables--------------------
backgroundR = 17;
backgroundG = 21;
backgroundB = 23;

beforeResR = beforeResG = beforeResB = 187;
// beforeResG = 187;
// beforeResB = 187;

afterResR = 224;
afterResG = 77;
afterResB = 70;

idkResR = idkResG = idkResB = 80;

beforeHighlightR = beforeHighlightG = beforeHighlightB = 230;
// beforeHighlightG = 230;
// beforeHighlightB = 230;

afterHighlightR = 244;
afterHighlightG = 40;
afterHighlightB = 40;

idkHighlightR = idkHighlightG = idkHighlightB = 150;

//-----------Global value showing active date period-------------
var activeDatePeriod;
var activeDatePeriodString;
var overDatePeriodString = "";
var overDatePeriodRect;
var totaldpCount = 0;
var minimumDtPrdH = 3;
var closestDist;
var closestEvent;

//-----------Global Introduction varialbes-------------
var runSlide1 = true;
var runSlide2 = true;
var runSlideLast = true;
var introOpac = 150;

var slide1Opac = 255;
var slide2Opac = 255;
var slideLastOpac = 150;


//----------Global transition variables------------
var transitionOpac = 255;
var runTransition = false;

function preload()
{
    //---------------Load the HRW data--------------------
    hrwtable = loadTable("data/HRW_forProcessingV02.csv", "header");

    //---------------Load the data for the date period-----------------
    datePeriodTable = loadTable("data/HRW_dateper03.csv", "header");

    //---------------Load the data for the date headers-----------------
    dateHeadersTable = loadTable("data/dateHeaders.csv", "header");

    //---------------Load the images--------------------
    initialMap = loadImage("images/initialMap.png");
    roadUnderlay = loadImage("images/Align Maps v02 yoffset 75-01.png");

    //Determine map size up here
    mapSizeM = haversine(lat1, lat1, long1, long2);

    //Generate siteId header list, will use to display counter headers
    siteIdHeaderList[0]="Building (General / Default)";
    siteIdHeaderList[1]="Industrial Facility";
    siteIdHeaderList[2]="Commercial (warehouse/factory)";
    siteIdHeaderList[3]="Road";
    siteIdHeaderList[4]="UN Building";
    siteIdHeaderList[5]="Field";
    siteIdHeaderList[6]="Mosque";
    siteIdHeaderList[7]="Hospital";
    siteIdHeaderList[8]="School / University";
    siteIdHeaderList[9]="Market";
    siteIdHeaderList[10]="Cemetery";
    siteIdHeaderList[11]="Total";

    //Make the count list as long as the site ide header list so that each header corresponds to an appropriate count
    for (var i =0; i< siteIdHeaderList.length; i++)
    {
        siteIdTotalsCntList[i]=0;
        siteIdActiveCntList[i]=0;
    }
}

function setup()
{
    activeDatePeriodString = "";
    
    //---Move the data from an hrwtable into an array of hrwevent objects and count the total number of buildings hit
    rowCount = hrwtable.getRowCount();
    for (var row = 0; row < rowCount; row++)
    {
        // hrweventList[row] = hrwtable.getRow(row).getString("OBJECTID");
        hrweventList[row] = new HRWevent(hrwtable.getRow(row).getString("OBJECTID"), hrwtable.getRow(row).getString("DamageID1"), hrwtable.getRow(row).getString("SensorDate"), hrwtable.getRow(row).getString("DatePeriodStart"), hrwtable.getRow(row).getNum("Start Dt"), hrwtable.getRow(row).getNum("End Dt"), hrwtable.getRow(row).getNum("Lat"), hrwtable.getRow(row).getNum("Long"), hrwtable.getRow(row).getNum("Radius (m)"), hrwtable.getRow(row).getString("SiteID"), hrwtable.getRow(row).getString("DatePeriod"));
        siteIdTotalsCntList[whichSiteId(hrwtable.getRow(row).getString("SiteID"))[0]] = siteIdTotalsCntList[whichSiteId(hrwtable.getRow(row).getString("SiteID"))[0]] + 1;
    }
    //Capture the total number of buildings recorded
    siteIdTotalsCntList[11] = rowCount;
    // closestEvent = new HRWevent(hrwtable.getRow(0).getString("OBJECTID"), hrwtable.getRow(0).getString("SensorDate"), hrwtable.getRow(0).getString("DatePeriodStart"), hrwtable.getRow(0).getNum("Start Dt"), hrwtable.getRow(0).getNum("End Dt"), hrwtable.getRow(0).getNum("Lat"), hrwtable.getRow(0).getNum("Long"), hrwtable.getRow(0).getNum("Radius (m)"), hrwtable.getRow(0).getString("SiteID"), hrwtable.getRow(0).getString("DatePeriod"));
    closestEvent = hrweventList[0];

    //-------Put the date periods into date period objects and count the total number of data points
    rowCount = datePeriodTable.getRowCount();
    for (var row = 0; row < rowCount; row++)
    {
        datePeriodList[row] = new datePeriod(datePeriodTable.getRow(row).getNum("Start Date dt"), datePeriodTable.getRow(row).getNum("End Date dt"), datePeriodTable.getRow(row).getNum("Count"), datePeriodTable.getRow(row).getString("DatePeriod"));
    }
    //Calculate the total number of date period events
    var listLen = datePeriodList.length;
    for (var i = 0; i < datePeriodList.length; i++)
    {
        totaldpCount = totaldpCount + datePeriodList[i].getCount();
    }
    // Calculate the height of each datePeriod rectangle
    var thisRectH;
    for (var i = 0; i <datePeriodList.length; i++)
    {
        // datePeriodList[i].setRectH(datePeriodList[i].getCount()/totaldpCount*(canvasheight-dtPeriodCoordY));
        datePeriodList[i].setRectH(datePeriodList[i].getCount()/totaldpCount*(canvasheight-dtPeriodCoordY-datePeriodList.length*minimumDtPrdH));
    }

    //Calculate where these datePeriod rectangles will be on the page
    var lastCoordY = 0;
    for (var i = 0; i < datePeriodList.length; i++)
    {
        if(i<1)
        {
            //initial case
            lastCoordY = datePeriodList[i].getRectH();
        } else {
            //all other cases
            datePeriodList[i].setCoordY(lastCoordY);
            lastCoordY = lastCoordY + datePeriodList[i].getRectH();
        }
    }

    //------Put the date headers year, month, and location (dt, relative to 10/31/13
    //------in the date headers list
    rowCount = dateHeadersTable.getRowCount();
    for(var row=0; row<rowCount; row++)
    {
        dateHeadersList[row]=[dateHeadersTable.getRow(row).getString("Year blank"), dateHeadersTable.getRow(row).getString("Month String"), dateHeadersTable.getRow(row).getNum("Month dt")]
    }
    print(dateHeadersList);

    //Calculate the graph of total count of building events per day here
    var totalEventsOnDt = 0;
    for(var dt = -1*(dtPeriodCoordX); dt < maxDtNum; dt++)
    {
        for(var i = 0; i<datePeriodList.length; i++)
        {
            if((dt > parseInt(datePeriodList[i].getStEndDts()[0])) && (dt <= parseInt(datePeriodList[i].getStEndDts()[1])))
            {
                totalEventsOnDt = totalEventsOnDt + datePeriodList[i].getCount();
            }
        }
        eventsPerDayList[dt+dtPeriodCoordX] = totalEventsOnDt;
        totalEventsOnDt = 0;
    }
    // print(eventsPerDayList);
    // print(datePeriodList[1].getStEndDts());

    createCanvas(canvaswidth, canvasheight);

    // This is when we were loading the map initially
    // for (var i = 0; i < hrweventList.length; i++)
    // {
    //     // hrweventList[i].update();
    //     hrweventList[i].display();
    // }
    // saveCanvas("initial map", "png");

}

function draw()
{
    noStroke();
    background(backgroundR, backgroundG, backgroundB);


        //Reset closest distance every time the code runs
        closestDist = canvaswidth*canvasheight;
        

        tint(255,100);
        image(roadUnderlay,dtPeriodWidth,0,canvaswidth-dtPeriodWidth, underlayH);  //without mapOffsetY value was 0
        // rect(0,0,dtPeriodWidth, canvasheight);
        
        //If a date period is selected, fade out the image of the map below our dots
        if(String(activeDatePeriodString)!=""){
            tint(255,45);
            // print("passed");
        } else {
            tint(255,255);
            // print("failed");
        }
        image(initialMap, 0,0,canvaswidth, canvasheight);



        //Dispay the active HRW events AND count the types of buildings in the active date period
        var totalActiveSites = 0;
        for(var i = 0; i < activeHrwEventList.length; i++)
        {
            activeHrwEventList[i].update();
            activeHrwEventList[i].display();
            // siteIdActiveCntList[whichSiteId(activeHrwEventList[i].getSiteId())[0]] = siteIdActiveCntList[whichSiteId(activeHrwEventList[i].getSiteId())[0]]+1;   //being calculated on click now
        }
        //Add the total number of active events to the list
        siteIdActiveCntList[siteIdActiveCntList.length-1] = activeHrwEventList.length;

        //----------------      DRAW ALL OF THE TITLES AND LINES TO DELINATE PORTIONS OF THE MAP     -------------------
        push();
        textAlign(LEFT, TOP);
        translate(12,10);
        textSize(22);
        fill(255);
        text("Urban Damage Identified by Human Rights Watch in Aleppo",0,0);
        pop();

        textAlign(RIGHT);
        textSize(16);
        push();
        translate(dtPeriodWidth*11/20, 75);   //was 85 down
        // fill(200);
        // rect(0,5,dtPeriodWidth*2/5, -30);   //text box around active date period
        fill(255);
        text("Damage Occured Between: ", 0, 0);
        textAlign(LEFT);
        fill(255, transitionOpac);
        if(activeDatePeriodString!="")
        {
            text(" "+activeDatePeriodString, 0, 0);
        } else {
            text(" [Select a Period]", 0, 0);
        }
        pop();

        var lowerBarY = 614;

        strokeWeight(.5);
        stroke(255,255);
        line(0, dtPeriodCoordY-1, dtPeriodWidth, dtPeriodCoordY-1); //line above date period bars
        line(dtPeriodWidth, 0, dtPeriodWidth, canvasheight);    //line seperating map from bars
        line(0,lowerBarY, dtPeriodWidth, lowerBarY);    //line seperating date period bars from graph of total


        //----Display building / site id counters here----------
        line(dtPeriodWidth + (canvaswidth/10), lowerBarY, canvaswidth-canvaswidth/20, lowerBarY);   //lines to hold building count data
        line(dtPeriodWidth + canvaswidth/10, lowerBarY + (canvasheight - lowerBarY)/2, canvaswidth-canvaswidth/20, lowerBarY + (canvasheight - lowerBarY)/2);   //lines to hold building count data

        noStroke();
        fill(126);
        textAlign(RIGHT, CENTER);
        textSize(12);
        var activeRowY = (canvasheight - lowerBarY)/4;
        var totalRowY = (canvasheight - lowerBarY)*3/4;
        text("In this date period", dtPeriodWidth+canvaswidth/10, lowerBarY+activeRowY);
        text("Total", dtPeriodWidth+canvaswidth/10, lowerBarY+totalRowY);

        //text showing aggregate graph title
        textAlign(LEFT, TOP);
        text("Total Possible Damage Per Day", 8, lowerBarY);
        
        //Print the appropriate text and counts for each siteID type
        var length = (canvaswidth-canvaswidth/20-(dtPeriodWidth + canvaswidth/10)); //length of the table conating siteId counters
        var thisFill = 0;
        for(var i = 0; i<siteIdHeaderList.length; i++)
        {
            push();
            if(closestEvent.getEventOver() && String(closestEvent.getSiteId()) == String(siteIdHeaderList[i]))
            {
                thisFill = 255;
            } else {
                thisFill = 126;
            }
            translate(dtPeriodWidth+canvaswidth/10+(i+1)*length/(siteIdHeaderList.length+1), lowerBarY);
            rotate(-HALF_PI);
            textAlign(LEFT, CENTER);
            fill(thisFill);
            text(whichSiteId(siteIdHeaderList[i])[1], 5, 0);
            rotate(HALF_PI);
            textAlign(CENTER);
            fill(thisFill, transitionOpac);
            text(siteIdActiveCntList[i], 0, activeRowY);
            fill(thisFill);
            text(siteIdTotalsCntList[i],0,totalRowY);
            pop();
        }

        //-----Draw the date axis lines and headers here-----
        strokeWeight(0.5);
        stroke(255, 50);
        // textAlign(LEFT, CENTER);
        push();
        translate(dtPeriodCoordX, dtPeriodCoordY);
        var thisHdrsX = 0;
        for (var i = 0; i<dateHeadersList.length-1; i++)
        {
            thisHdrsX = map(dateHeadersList[i][2], 0, maxDtNum, 0, dtPeriodWidth-dtPeriodCoordX);
            line(thisHdrsX, -8, thisHdrsX, canvasheight);   //draw the axis line
            translate(thisHdrsX,0);
            rotate(-HALF_PI);
            textAlign(LEFT, CENTER);
            text(dateHeadersList[i][1], 10, 0);  //draw the month text
            rotate(HALF_PI);
            textAlign(CENTER);
            text(dateHeadersList[i][0], 0, 10);
            translate(-1*thisHdrsX,0);

        }
        //Draw the UN resolution Line and text
        var resTextOffset = 5;
        thisHdrsX = map(resolutionDt, 0, maxDtNum, 0, dtPeriodWidth-dtPeriodCoordX);
        stroke(255,255);
        translate(thisHdrsX, -60);
        line(0, 0, 0, canvasheight);
        line(0,0,resTextOffset,0);
        noStroke();
        textAlign(LEFT);
        text("UN Resolution", resTextOffset, 0);
        pop();

        //--END--Display building / site id counters here----END------


        // //Draw the graph of total count of building events per day here
        var plotX1= 0;
        var plotX2 = dtPeriodWidth;
        var plotY1 = canvasheight;
        var plotY2= lowerBarY;
        var graphMax = 1500;
        fill(126);
        noStroke();
        beginShape();
        for(var i = 0; i<eventsPerDayList.length; i++)
        {
            var pointX = map(i, 0, eventsPerDayList.length, plotX1, plotX2);
            var pointY = map(eventsPerDayList[i], 0, graphMax, plotY1, plotY2);
            vertex(pointX, pointY);
            // print(pointX + ", " + pointY);
        }
        vertex(plotX2, plotY1);
        vertex(plotX1, plotY1);
        endShape(CLOSE);
        //Draw the active date period on top of this chart
        if(activeDatePeriodString!="")
        {
            fill(200);
            var activeRectX = map(activeDatePeriod.getStEndDts()[0], 0, eventsPerDayList.length, plotX1, plotX2);
            var activeRectH = map(activeDatePeriod.getCount(), 0, graphMax, plotY1, plotY2);
            var activeRectW = map(activeDatePeriod.getStEndDts()[1]-activeDatePeriod.getStEndDts()[0], 0, eventsPerDayList.length, plotX1, plotX2);
            // print(activeRectH +", " + activeDatePeriod.getCount());
            rect(activeRectX+10, activeRectH-1, activeRectW, plotY1-activeRectH );
        }


        //--------------- ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ --------------

        //Draw the date period data bars
        overDatePeriodString =""; //reset the date period string
        overDatePeriodRect = [0,0,0,0]
        strokeWeight(1);
        stroke(backgroundR, backgroundG, backgroundB);
        for (var i = 0; i < datePeriodList.length;i++)
        {
            datePeriodList[i].update();
            datePeriodList[i].display();
        }
        noStroke();

        //If we're hovering over a date period bar, show us it's text at the end of the bar
        if(overDatePeriodString!="")
        {
            fill(255);
            if(mouseY <380)
            {
                textAlign(LEFT, CENTER);
                text(overDatePeriodString, overDatePeriodRect[0]+dtPeriodCoordX+overDatePeriodRect[2] + 5, overDatePeriodRect[1]+dtPeriodCoordY+overDatePeriodRect[3]/2);
            } else {
                textAlign(RIGHT, CENTER);
                text(overDatePeriodString, overDatePeriodRect[0]+dtPeriodCoordX-5, overDatePeriodRect[1]+dtPeriodCoordY+overDatePeriodRect[3]/2);
            }
            //do the test here
            
        }



        //Draw the line down to the bottom of the canvas here
        if(activeDatePeriodString!="")
        {
            stroke(255,126);
            strokeWeight(.5);
            push();
            translate(dtPeriodCoordX, dtPeriodCoordY);
            line(activeDatePeriod.getRect()[0], activeDatePeriod.getRect()[1]+ activeDatePeriod.getRect()[3], activeDatePeriod.getRect()[0], canvasheight);
            line(activeDatePeriod.getRect()[0]+activeDatePeriod.getRect()[2], activeDatePeriod.getRect()[1]+ activeDatePeriod.getRect()[3], activeDatePeriod.getRect()[0]+activeDatePeriod.getRect()[2], canvasheight);
            pop();
        }



        //Highlight the closest point if we have selected a date period
        if(activeDatePeriodString!="")
        {
            if(mouseX > dtPeriodWidth)  // attemp to speed up script, only run when over map
            {
                if(closestEvent.getEventOver())
                {
                    print(closestEvent);
                    fill(0,0);
                    stroke(255,255);
                    ellipse(closestEvent.getLong()+dtPeriodWidth, closestEvent.getLat(), closestEvent.getRadius()*10, closestEvent.getRadius()*10);
                    fill(255);
                    noStroke();
                    if(mouseX<dtPeriodWidth+mapwidth/2){
                        textAlign(LEFT);
                        push();
                        translate(mouseX+8*closestEvent.getRadius(), mouseY);
                    } else {
                        push();
                        translate(mouseX-8*closestEvent.getRadius(), mouseY);
                        textAlign(RIGHT);
                    }
                    text(whichSiteId(closestEvent.getSiteId())[1]+"\n"+
                        closestEvent.getDamageId()+"\n"+
                        "Damage Area: " + round(closestEvent.getLength())+" sq m\n", 0, 0);
                    pop();
                }
            }
        }

        fill(150);
        textAlign(RIGHT, BOTTOM);
        textSize(8);
        text("Data Source: Human Rights Watch, Satelilite Imagery Analysis Team, 2015  |  Visualization: Mike Howard, Center for Spatial Research, Columbia University, 2015 ", canvaswidth, canvasheight);


        // print(mouseX + " " + mouseY);
    // }

    //Put transition over
    // if(runTransition)
    // {
    //     noStroke();
    //     if(transitionOpac<=255)
    //     {
    //         translate(dtPeriodWidth*3/5, 40);
    //         fill(126, 255-transitionOpac);
    //         rect(0,5,dtPeriodWidth*2/5, -30);
    //     } else if(transitionOpac >255*2){  //stop transitioning and reset the values
    //         transitionOpac = 0;
    //         runTransition = false; 
    //     }
    //     transitionOpac=transitionOpac+90;
    // }

    if(runTransition)
    {
        if(transitionOpac<255)
        {
            transitionOpac=transitionOpac+70;
        } else {
            runTransition = false;
        }

    } else {
        transitionOpac = 255;
    }
    

    // var slide1 opac;
    //Fade out the introductory image
    if(introOpac > 0)
    {
        if(!runSlide1)
        {

            if(!runSlideLast)
            {
                introOpac = introOpac-10;   
            }

        }

        fill(backgroundR, backgroundG, backgroundB, introOpac);
        rect(0,0, canvaswidth, canvasheight);
        // fill(255,introOpac);
        textSize(28);
        noStroke();
        textAlign(CENTER, BOTTOM);
        if(runSlide1)
        {
            fill(255, slide1Opac);
        } else {
            fill(255, introOpac);
        }
        text("1. Click on a data bar \n"+
            "to locate those events\n"+
            "on the map", dtPeriodWidth/2, canvasheight/3);
        if(runSlide2 && !runSlide1)
        {
            fill(255, slide2Opac);
        } else {
            fill(255, introOpac);
        }
        text("2. Mouse over an event\n"+
            "to learn more about it", canvaswidth-dtPeriodWidth/2, canvasheight/3);
        fill(255, introOpac);
        text("[Click to begin]", canvaswidth/2, canvasheight*2/3);
    }




}

function mouseClicked()
{   

    if(runSlideLast && !runSlide1)
    {
        runSlideLast = false;
    } else {
        if(mouseX<dtPeriodWidth)
        {
            //Tell the transitions to run
            runTransition = true;
            transitionOpac = 0;
            //If we're over the dateperiods and we click, show the active date period
            // activeDatePeriodString = "";
            activeDatePeriodString = "";
            for (var i = 0; i<datePeriodList.length;i++)
            {
                datePeriodList[i].update();
                activeDatePeriodString = datePeriodList[i].updateDatePeriod();
            }
            

            //Updates the datePeriod to be the activeDatePeriod so we can get its attributes to draw it on our graph
            for (var i = 0; i < datePeriodList.length;i++)
            {
                if(String(activeDatePeriodString)==String(datePeriodList[i].getDatePeriodString()))
                {
                    activeDatePeriod=datePeriodList[i];
                    break;
                }
            }
            

            for (var i = 0; i < hrweventList.length; i++)
            {
                hrweventList[i].inActivePeriod(activeDatePeriodString);
            }


            activeHrwEventList = [];
            var activeLength = 0;
            //Draw the hrwevents
            for (var i = 0; i < hrweventList.length; i++)
            {
                // hrweventList[i].display();
                //check to see if the event is in the active date period and add it to the activehrwevent list here
                if(hrweventList[i].getActivePeriod())
                {
                    activeHrwEventList[activeLength] = hrweventList[i];
                    activeHrwEventList[activeLength].display();
                    activeLength = activeLength + 1;
                }

            }

            //Calculate the count of each siteId category in the active date period
            //Reset each count equal to zero here
            for(var j = 0; j<siteIdActiveCntList.length;j++)
            {
                siteIdActiveCntList[j]=0;
            }
            // now do the new count
            if(activeDatePeriodString!="")
            {
                for(var i = 0; i<activeHrwEventList.length;i++)
                {
                    siteIdActiveCntList[whichSiteId(activeHrwEventList[i].getSiteId())[0]] = siteIdActiveCntList[whichSiteId(activeHrwEventList[i].getSiteId())[0]] + 1;
                }
                print(siteIdActiveCntList);
            } 
        }

        
    }

    if(!runSlide1)
    {
        runSlide2 = false;
        slide2Opac = 150;
    }

    if(runSlide1)
    {
        runSlide1 = false;
        slide1Opac = 150;
    }



}

//-----------------------------------------------------

function haversine(lat1, lat2, long1, long2)
{
    var constantR = 6371000.0; //earth radius in meters
    var phi1 = radians(lat1);
    var phi2 = radians(lat2);
    var deltaPhi = radians(lat2-lat1);
    var deltaLambda = radians(long2 - long1);

    var resultA = sin(deltaPhi/2)*sin(deltaPhi/2) + cos(phi1)*cos(phi2)*sin(deltaLambda/2)*sin(deltaLambda/2);
    var resultC = 2*atan2(sqrt(resultA), sqrt(1-resultA));
    return (constantR*resultC);
}

function overRectangle(_x, _y, _rectWidth, _rectHeight)
{
    if(mouseX >= _x && mouseX <= _x+_rectWidth &&
        mouseY >= _y && mouseY <= _y + _rectHeight)
    {
        return true;
    } else {
        return false;
    }
}

function whichSiteId(_inputString)
//Function that returns the index and name (shorted siteID name to display in animation)
//when fed some event's siteId
{
    var foundIndex;
    var returnString = _inputString;
    switch(_inputString)
    {
    case "Building (General / Default)":
        foundIndex = 0;
        returnString = "Building";
        break;
    case "Industrial Facility":
        foundIndex = 1;
        returnString = "Industrial";
        break;
    case "Commercial (warehouse/factory)":
        foundIndex = 2;
        returnString = "Commercial";
        break;
    case "Road":
        foundIndex = 3;
        break;
    case "UN Building":
        foundIndex = 4;
        break;
    case "Field":
        foundIndex = 5;
        break;
    case "Mosque":
        foundIndex = 6;
        break;
    case "Hospital":
        foundIndex = 7;
        break;
    case "School / University":
        foundIndex = 8;
        returnString = "School";
        break;
    case "Market":
        foundIndex = 9;
        break;
    case "Cemetery":
        foundIndex = 10;
        break;
    case "Total":
        foundIndex = 11;
        break;
    }
    return [foundIndex, returnString];

}

function whichDamageId(damageId)
//Function that returns the index and name (shorted siteID name to display in animation)
//when fed some event's siteId
{
    var newDamageId;
    switch(damageId)
    {
    case "Destroyed (bld)":
        newDamageId = "Destroyed";
        break;
    case "Impact Crater (Damage to Field)":
        newDamageId = "Impact Crater";
        break;
    case "Severe Damage (bld)":
        newDamageId = "Severe Damage";
        break;
    case "Impact Crater (Damage to Road)":
        newDamageId = "Impact Crater";
        break;
    case "Moderate Damage (bld)":
        newDamageId = "Moderate Damage";
        break;
    case "Unknown / Uncertain":
        newDamageId = "Uncertain Damage Type";
        break;
    case "Large Impact Site (To assess further for munition type/attribution)":
        newDamageId = "Impact Site";
        break;
    }
    return newDamageId;

}

//------------------CUSTOM CLASSES TO STORE DATA IN OBJECTS----------------------------------
function HRWevent(_id, _damageId, _sensordate, _startdateperiod, _startDt, _endDt, _lat, _long, _length, _siteId, _datePeriod)
{
    this.id = _id;
    this.damageId = whichDamageId(_damageId);
    this.sensordate = _sensordate;
    this.startdateperiod = _startdateperiod;
    this.startDt = _startDt;
    this.endDt = _endDt;
    this.givenlength = _length;
    this.radius = map(_length, 0, mapSizeM, 0, mapwidth)*2;
    // this.radius = map(_length, 0, 17448, 0, 740);
    this.siteId = _siteId;
    this.datePeriod = _datePeriod;
    //Scaling lat long to display on our map
    this.latitude = map(_lat, lat1, lat2, 0, mapheight) + mapOffsetY;
    this.longitude = map(_long, long1, long2, 0, mapwidth);

    //Extracting day, month, year from the start of the date period
    var locFirstSlash = parseInt(this.sensordate.indexOf("/"));
    var locSecondSlash = parseInt(this.sensordate.lastIndexOf("/"));
    this.sensormonth = parseInt(this.sensordate.substring(0, locFirstSlash));
    this.sensorday = parseInt(this.sensordate.substring(locFirstSlash+1, locSecondSlash));
    this.sensoryear = parseInt(this.sensordate.substring(locSecondSlash+1, this.sensordate.length));

    //Extracting day, month, year from the start of the date period
    locFirstSlash = parseInt(this.startdateperiod.indexOf("/"));
    locSecondSlash = parseInt(this.startdateperiod.lastIndexOf("/"));
    this.periodmonth = parseInt(this.startdateperiod.substring(0, locFirstSlash));
    this.periodday = parseInt(this.startdateperiod.substring(locFirstSlash+1, locSecondSlash));
    this.periodyear = parseInt(this.startdateperiod.substring(locSecondSlash+1, this.startdateperiod.length));

    //Booleans that account for resolution, active period, and mouse over event
    this.beforeResolution = false;
    this.eventOver = false;
    this.isActivePeriod = false;

    //Checking  to see if the beginning of the date period was after the UN resolution
    this.beforeResolution = true;
    if(this.periodyear > resolutionYear) {
        this.beforeResolution = false;
    } else if (this.periodyear == resolutionYear) {
        if (this.periodmonth > resolutionMonth) {
            this.beforeResolution = false;
        } else if (this.periodmonth == resolutionMonth) {
            if (this.periodday >= resolutionDay) {
                this.beforeResolution = false;
            }
        }
    }

    this.inActivePeriod = function(givenDatePeriod)
    //Function that checks to see if this event is in the active date period
    // YO RUN THIS FUNCTION ON THE CLICK TO UPDATE THOSE VALUES !!!!!!!!!!!!!!!!!!!!!!!!!!!
    {
        // if(new String(activeDatePeriodString).valueOf() == new String(this.datePeriod).valueOf())
        if(String(givenDatePeriod) == String(this.datePeriod))
        {
            this.isActivePeriod = true;
        } else {
            this.isActivePeriod = false;
        }
    }

    this.getActivePeriod = function()
    {
        return this.isActivePeriod;
    }

    this.display = function()
    {
        push();
        translate(dtPeriodWidth, 0);
        //GIVE DIFFERENT HIGH COLORS IF BEFORE RESOLUTION OR IN RESOLUTION
        if(this.beforeResolution)
        {
            if(this.endDt < resolutionDt)
            {
                fill(beforeResR, beforeResG, beforeResB, transitionOpac);
            } else {
                fill(idkResR, idkResG, idkResB, transitionOpac);
            }
        } else {
            fill(afterResR, afterResG, afterResB, transitionOpac);
        }

        //Outline event if it's in the active period
        //THIS IS ALWAYS RETURN TRUE NOW THAT I'M SHOWING ONLY ACTIVE EVENTS
        if(this.isActivePeriod)
        {
            strokeWeight(.3);
            stroke(255, transitionOpac);
        }else{
             stroke(0,0);
        }
        ellipse(this.longitude, this.latitude, this.radius, this.radius);
        pop();
    }

    this.update = function()
    {
        if(mouseX > dtPeriodWidth){ //only run when mouse is over the map
            //see if the mouse is over the circle here
            var catchmentMultiplier = 32;
            if(this.overEvent(this.longitude+dtPeriodWidth, this.latitude, this.radius*catchmentMultiplier))
            {
                // this.eventOver = true;
                
                //Only event over the closest point
                var d = dist(this.longitude+dtPeriodWidth, this.latitude, mouseX, mouseY);
                if(d < closestDist)
                {
                    closestDist = d;
                    closestText = this.siteId;
                    closestEvent = this;
                    this.eventOver = true;
                } else {
                    this.eventOver = false;
                }
            
            } else {
                this.eventOver = false;
            }
        } else {
            this.eventOver = false;
        }
    }

    this.getEventOver = function()
    {
        return this.eventOver;
    }

    this.getSiteId = function()
    {
        return this.siteId;
    }

    this.getLat = function()
    {
        return this.latitude;
    }

    this.getLong = function()
    {
        return this.longitude;
    }

    this.getRadius = function()
    {
        return this.radius;
    }

    this.getLength = function()
    {
        return this.givenlength;
    }

    this.getDamageId = function()
    {
        return this.damageId;
    }

    this.overEvent = function(eventX, eventY, eventRadius)
    {
        //look to see if we're over the rectangel here
        var distX = eventX - mouseX;
        var distY = eventY - mouseY;
        if(sqrt(sq(distX)+sq(distY)) < eventRadius/2)
        {
            return true;
        } else {
            return false;
        }
    }

}

function datePeriod(_startDate, _endDate, _count, _datePeriodString)
//probably have to add some location text in the date period function
{
    this.startDate = _startDate;
    this.endDate = _endDate;
    this.count = _count;
    this.datePeriodString = _datePeriodString;
    this.rectH = minimumDtPrdH; //minimum size of rectangle height
    this.coordY = 0;
    //Scaling the width of the rectangles so that all bars fall on canvas
    //Note that maxDtNum should be swapped our here for w/e max(end dt) is of all dt periods
    this.rectX1 = map(this.startDate, 0, maxDtNum, 0, dtPeriodWidth-dtPeriodCoordX);
    this.rectWidth = map(this.endDate-this.startDate, 0, maxDtNum, 0, dtPeriodWidth-dtPeriodCoordX);
    this.overDatePeriod = false;
    // if(this.startDate<resolutionDt)
    // {
    //     this.beforeResolution = true;
    // } else {
    //     this.beforeResolution = false;
    // }

    if(this.rectX1 < 0)
    {
        this.rectX1 = -1*dtPeriodCoordX;
        this.rectWidth = dtPeriodCoordX;
    }

    this.getCount = function()
    {
        return this.count;
    }

    this.setRectH = function(_newRectH)
    {
        if(_newRectH > this.rectH)
        {
            this.rectH = _newRectH;
        }
    }

    this.getRectH = function()
    {
        return this.rectH;
    }

    this.setCoordY = function(_coordY)
    {
        this.coordY = _coordY;
    }

    this.getRect = function()
    {
        return [this.rectX1, this.coordY, this.rectWidth, this.rectH];
    }

    this.getDatePeriodString = function()
    {
        return this.datePeriodString;
    }

    this.getStEndDts = function()
    {
        return [this.startDate, this.endDate];
    }

    this.updateDatePeriod = function()
    {
        if(this.overDatePeriod)
        {
            return this.datePeriodString;
        } else {
            return activeDatePeriodString;
        }
    }

    this.update = function()
    {
        if(mouseX<dtPeriodWidth)   //only run when our mouse is over the date period bars
        {
            if(overRectangle(this.rectX1+dtPeriodCoordX,this.coordY+dtPeriodCoordY,this.rectWidth,this.rectH))
            {
                this.overDatePeriod = true;
                overDatePeriodString = this.datePeriodString;
                overDatePeriodRect = this.getRect();
            } else {
                this.overDatePeriod = false;
            }
        } else {
            this.overDatePeriod = false;
        }
    }

    this.display = function()
    {

        push();
        translate(dtPeriodCoordX, dtPeriodCoordY);
        // if(this.overDatePeriod)
        // {
        //     fill(255);
        // } else {    
        if(this.startDate <resolutionDt)    //checks to see if it was before resolution
        {
            if(this.endDate <resolutionDt)
            {
                fill(beforeResR, beforeResG, beforeResB);
            } else {
                fill(idkResR, idkResG, idkResB);
            }
            
        } else {
            fill(afterResR, afterResG, afterResB);
        }
            // fill(126);
        // }

        if(String(activeDatePeriodString)==String(this.datePeriodString))
        {
            // stroke(255);
            // fill(200);
            if(this.startDate < resolutionDt)
            {
                if(this.endDate < resolutionDt)
                {
                    fill(beforeHighlightR, beforeHighlightG, beforeHighlightB);
                } else {
                    fill(idkHighlightR, idkHighlightG, idkHighlightB);
                }
            } else {
                fill(afterHighlightR, afterHighlightG, afterHighlightB);
            }
        }


        //Override any color with white if our mouse is over it
        if(this.overDatePeriod)
        {
            fill(255);
        }
        rect(this.rectX1,this.coordY,this.rectWidth,this.rectH);
        pop();
    }
}


