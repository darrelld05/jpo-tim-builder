import { Component, OnInit, Input } from '@angular/core';
import { Tim } from '../../classes/tim';
import { RSU } from '../../classes/rsu';
import { TimSample } from '../../classes/tim-sample';
import { DataFrame } from '../../classes/data-frame';
import { ItisCode } from '../../classes/itis-code';
import { Region } from '../../classes/region';
import { OldRegion } from '../../classes/old-region';
import { J2735Position3D } from '../../classes/J2735-Position-3D';
import { Geometry } from '../../classes/geometry';
import { Path } from '../../classes/path';
import { ComputedLane } from '../../classes/computed-lane';
import { Circle } from '../../classes/circle';
import { SNMP } from '../../classes/snmp';
import { TimBuilderService } from '../../services/tim-builder.service';
import { RSUService } from '../../services/rsu.service';
import { ItisCodeService } from '../../services/itis-code.service';
import { MilepostService } from '../../services/mile-post.service';
import { CategoryService } from '../../services/category.service';
import { Response } from '@angular/http';
import { NodeXY } from '../../classes/node-xy';
import { Attributes } from '../../classes/attributes';
import { LocalNode } from '../../classes/local-node';
import { DisabledList } from '../../classes/disabled-list';
import { EnabledList } from '../../classes/enabled-list';
import { DataList } from '../../classes/data-list';
import { SpeedLimits } from '../../classes/speed-limits';
import { RegionPoint } from '../../classes/region-point';
import { ShapePoint } from '../../classes/shape-point';
import { RegionList } from '../../classes/region-list';
import { Index } from '../../classes/index';
import { Milepost } from '../../classes/mile-post';
import { Category } from '../../classes/category';
import { IMultiSelectOption, IMultiSelectSettings, IMultiSelectTexts  } from 'angular-2-dropdown-multiselect';

@Component({
	selector: 'tc-home',   
	templateUrl: './home.component.html',
	providers: [TimBuilderService, RSUService, ItisCodeService, MilepostService, CategoryService]
})
export class HomeComponent implements OnInit{

	itisCodes: ItisCode[];
	testJSON: string;
	tim: Tim;
	df: DataFrame;
	rsuData: RSU[];	
	errorMessage: string = '';
	isLoading: boolean = true;
	selectedItisCodeId: number;
	selectedCategory: number;
	snmpIndex: number;
	autoGenerateIndex: boolean;
	messages: string[];
	mapPoint: any;
	mileposts: Milepost[];  
	pathposts: Milepost[];	
	categories: Category[];	
	downloadJsonFlag: boolean;
	filteredItisCodes: IMultiSelectOption[];
    selectedItisCodes: number[];
    ddSettings: IMultiSelectSettings;
	ddText: IMultiSelectTexts;

   	constructor(private timBuilderService : TimBuilderService, private rsuService: RSUService, private itisCodeService: ItisCodeService, private milepostService: MilepostService, private categoryService: CategoryService){ }

	ngOnInit(){	

        this.ddSettings = {
			displayAllSelectedText: true
		};

		this.ddText = {
			defaultTitle: ''
		}; 
    	
    	this.selectedItisCodes = [];
		this.df = new DataFrame();
		this.tim = new Tim();
		this.messages = [];
		this.downloadJsonFlag = false;

		this.rsuService.getAll().subscribe(
			r => this.rsuData = r,
        	e => this.errorMessage = e,
        	() => { this.isLoading = false; console.log(this.rsuData);} 
		);

		this.milepostService.getAll().subscribe(
			i => this.mileposts = i,
        	e => this.errorMessage = e,
        	() => { this.isLoading = false; } 
		);

		this.itisCodeService.getAll().subscribe(
			i => this.itisCodes = i,
        	e => this.errorMessage = e,
        	() => { this.isLoading = false; } 
		);

		this.categoryService.getAll().subscribe(
			i => this.categories = i,
        	e => this.errorMessage = e,
        	() => { this.isLoading = false; } 
		);
	}

	checkChanged(e){
		for(let r of this.rsuData){  			
			if(r.rsuTarget == e.target.name){ 
				if(e.target.checked)
					r.isSelected = true;			
				else
					r.isSelected = false;
			}
		}
	}	

	onCategoryChanged(){	
		this.filteredItisCodes = this.itisCodes.filter(i => i.categoryId == this.selectedCategory ).map( function(obj){
			let rObj = { id: obj.itisCodeId, name: obj.description };
			return rObj;
		}); 
		this.selectedItisCodes = [];
	}

	downloadJsonChanged(e){
		this.downloadJsonFlag = !this.downloadJsonFlag;
	}	

	onEmit(newPath: Milepost[]) {
    	this.pathposts = newPath;
  	}

	submitFormGeometry(){    
		let builtTim: TimSample;
		// for each selected RSU
		for(let r of this.rsuData){ 
			r.rsuRetries = "1";
			r.rsuTimeout = "2000"; 	 			
			if(r.isSelected){ 
		     	this.timBuilderService.queryTim(r).subscribe(
					i => r.indicies = i.indicies_set,
					e => this.errorMessage = e,
					() => { 
						this.isLoading = false;	
						// build JSON 
						builtTim = this.buildJSON(r);       
						// send TIM to RSU
						this.sendTimToRSU(builtTim); 
					} 
				);				
			}
		}				
	}

	buildJSON(rsu: RSU):TimSample{

		let timSample = new TimSample();
		let tim = new Tim();		
		tim.msgCnt = "1"; // a sequence number within a stream of messages with the same DSRCmsgID from the same sender. 
		tim.index = this.findFirstAvailableIndex(rsu.indicies).toString();

		console.log("index: " + tim.index);
		console.log("start date time : " + this.df.startDateTime);
      
		var today = new Date();
		tim.timeStamp = today.toISOString(); // OPTIONAL

		//tim.packetID = "1";  // OPTIONAL
		tim.urlB = "null"; // OPTIONAL

		//The SSP index is used to control the data elements that follow the occurrence of the index. 
		//The index relates back to the SSP contents in the CERT used to declare what content is allowed by that CERT. 
		//In the absence of a matching index in the message sender’s CERT, the message contents are not valid. 
		this.df.sspTimRights = "0"; // integer 0-31, ??
		//this.df.frameType = "0";

		this.df.msgID = "RoadSignID"; // ??
		this.df.position = new J2735Position3D(); // optional
		this.df.position.latitude = "41.678473"; // optional ???
		this.df.position.longitude = "-108.782775"; // optional
		this.df.position.elevation = "917.1432"; // optional
		this.df.viewAngle = "1010101010101010"; // road sign related, heading slice, vehicle direction of travel while facing active side of sign
		this.df.mutcd = "5"; // road sign related, optional, tag for MUTCD code or "generic sign"
		this.df.crc = "0000000000000000"; // road sign related, Msg CRC, OPTIONAL, used to provide a cherck sum
		

		this.df.priority = "0"; // 0-7, 0 being least important, 7 being most important
		this.df.sspLocationRights = "3"; // integer 0-31, ??
		this.df.regions = [];
		// this.df.furtherInfoID = "test"; // optional

		let region = new Region();

		//The DescriptiveName data element is used in maps and intersections to provide a human readable and recognizable name for the feature that follows. 
		//It is typically used when debugging a data flow and not in production use. 
		//One key exception to this general rule is to provide a human-readable string for disabled travelers in the case of crosswalks and sidewalk lane objects.  
		region.name = "Testing TIM"; // OPTIONAL
		region.regulatorID = "0"; // OPTIONAL, a globally unique regional assignment value. typically assigned to a regional DOT authority. use zero for testing
		region.segmentID = "33"; // a unique mapping to the road segment in question within the above region of use during its period of assignment and use note that unlike intersectionID values, this value can be reused by the region 
		
		// 
		if(this.pathposts.length > 0){
			region.anchorPosition = new J2735Position3D(); // optional
			region.anchorPosition.latitude = this.pathposts[0].latitude.toString();
			region.anchorPosition.longitude = this.pathposts[0].longitude.toString();
			region.anchorPosition.elevation = (this.convertFeetToM(this.pathposts[0].elevation)).toString();
		}
		
		region.laneWidth = "7";  // integer 0-32767, units of 1 cm

		// enum
		// unavailable (0), -- unknown or NA, not typically used in valid expressions    
		// forward     (1), -- direction of travel follows node ordering     
		// reverse     (2), -- direction of travel is the reverse of node ordering     
		// both        (3)  -- direction of travel allowed in both directions
		region.directionality = "3"; // optional ??
		region.closedPath = "false"; // closed path, BOOLEAN, when true, last point closes to first
		

		region.description = "path";
		region.path = new Path();

		// -- A zoom scale applied in units of 2^N    
		// -- A value of 0 is a 1:1 zoom (no zoom)    
		// -- A value of 1 is a 2:1 zoom  
		// -- A value of 2 is a 4:1 zoom, etc.
		// -- The zoom value is applied to one or more offsets    
		// -- increase the span or range while reducing its precision  
		// -- The absence of a zoom, any offset element in a data     
		// -- frame implies a 1:1 zoom
		region.path.scale = "0"; // optional
		region.path.type = "ll";
		region.path.nodes = []; 

		
		let direction = 0;
		for(var i = 1; i < this.pathposts.length; i++){
			let node = new NodeXY();	
			node.nodeLong = (this.pathposts[i].longitude - this.pathposts[i-1].longitude).toString();
			node.nodeLat = Math.round(this.pathposts[i].latitude - this.pathposts[i-1].latitude).toString();	
		    node.delta = this.getDelta(Math.max(Number(node.nodeLat), Number(node.nodeLong)));
			console.log("long: " + node.nodeLong);		
			console.log("lat: " + node.nodeLat);		
			console.log(node.delta);			
			region.path.nodes.push(node);
			direction |= this.getDirection(this.pathposts[i].bearing);
		}

		region.direction = direction.toString(2); // heading slice	

		region.direction = "0".repeat((16 - region.direction.length)) + region.direction;

		this.df.sspMsgTypes = "2"; // allowed message types, integer 0-31
		this.df.sspMsgContent = "3"; // allowed message content, integer 0-31
		this.df.content = "Advisory"; // for now use advisory, can also be workzone, genericSign, speedLimit, or exitService

		this.df.items = [];		

		for(let i of this.selectedItisCodes){  						
			this.df.items.push(i.toString());			
		}

		this.df.url = "null"; // OPTIONAL
		this.df.regions.push(region);
		let dfa: DataFrame[] = [];
		dfa.push(this.df);
		tim.dataframes = dfa;
		timSample.tim = tim;

		timSample.rsus = [];
		timSample.snmp = new SNMP();
		timSample.snmp.rsuid = "0083";
		timSample.snmp.msgid = "31";
		timSample.snmp.mode = "1";
		timSample.snmp.channel = "178";
		timSample.snmp.interval = "2";
		timSample.snmp.deliverystart = "2017-06-01T17:47:11-05:00";
		timSample.snmp.deliverystop = "2018-01-01T17:47:11-05:15";
		timSample.snmp.enable = "1";
		timSample.snmp.status = "4";

		timSample.rsus.push(rsu);
	
		this.testJSON = JSON.stringify(timSample);	

		if(this.downloadJsonFlag)
			this.downloadJSON(this.testJSON);

		return timSample;  	
	}

	downloadJSON(json: string){		
		var element = document.createElement('a');
	    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(this.testJSON));
	    element.setAttribute('download', "tim.json");

	    element.style.display = 'none';
	    document.body.appendChild(element);

	    element.click();

	    document.body.removeChild(element);
	}

	convertFeetToCm(feet){
		return feet * 12 * 2.54;		
	}

	convertFeetToM(feet){
		return feet * .3;		
	}

	getDelta(distance): string{
		if(distance >= -.0002048 && distance < .0002048)
			return "node-LL1";
		else if(distance >= -.0008192 && distance < .0008192)
			return "node-LL2";
		else if(distance >= -.0032768 && distance < .0032768)
			return "node-LL3";
		else if(distance >= -.0131072 && distance < .0131072)
			return "node-LL4";
		else if(distance >= -.2097152 && distance < .2097152)
			return "node-LL5";
		else
			return "node-LL6";
	}

	getDirection(bearing): number{
		let direction = 0;

		if(bearing >= 0 && bearing <= 22.5)
			direction = 0;
		else if(bearing > 22.5 && bearing <= 45)
			direction = 1;
		else if(bearing > 45 && bearing <= 67.5)
			direction = 2;
		else if(bearing > 67.5 && bearing <= 90)
			direction = 3;
		else if(bearing > 90 && bearing <= 112.5)
			direction = 4;
		else if(bearing > 112.5 && bearing <= 135)
			direction = 5;
		else if(bearing > 135 && bearing <= 157.5)
			direction = 6;
		else if(bearing > 157.5 && bearing <= 180)
			direction = 7;
		else if(bearing > 180 && bearing <= 202.5)
			direction = 8;		
		else if(bearing > 202.5 && bearing <= 225)
			direction = 9;
		else if(bearing > 225 && bearing <= 247.5)
			direction = 10;
		else if(bearing > 247.5 && bearing <= 270)
			direction = 11;
		else if(bearing > 270 && bearing <= 292.5)
			direction = 12;
		else if(bearing > 292.5 && bearing <= 315)
			direction = 13;
		else if(bearing > 315 && bearing <= 337.5)
			direction = 14;
		else if(bearing > 337.5 && bearing <= 360)
			direction = 15;

		return direction;
	}

	sendTimToRSU(tim: TimSample){
		// set date sent
		tim.dateSent = new Date().toISOString();
		// send to RSU
		console.log(tim);
		this.timBuilderService
     	.sendTimToRSU(tim)
     	.subscribe((r: Response) => {
     		// set date received 
     		tim.dateReceived = new Date().toISOString();
     		this.verifyDeposit(parseInt(tim.tim.index), tim.rsus[0]);
     	})   
	}

	findFirstAvailableIndex(indicies: number[]): number{
		for (var i = 1; i < 100; i++) {
			if(!indicies.includes(i)){
				return i;
			}
		}
	}

	verifyDeposit(index: number, rsu: RSU){
		let indicies: number[];
		this.timBuilderService.queryTim(rsu).subscribe(
			i => indicies = i.indicies_set,
			e => this.errorMessage = e,
			() => { 
				if(indicies.includes(index))
					this.messages.push("TIM successfully deposited to RSU " + rsu.rsuTarget + " at index " + index);				
				else
					this.messages.push("TIM deposit failed on RSU " + rsu.rsuTarget);				
			} 
		);
	}
}
