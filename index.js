class Location{
constructor(longitude,latitude){
  // Latitude + - Corresponds to North South
  // Longitude + - Coresponds to East West
  this.longitude = longitude;
  this.latitude = latitude;
}
};
class periNode{
constructor(location,nextloc,lastloc){
  this.location = location
  this.nextloc = nextloc
  this.lastloc = lastloc
}
};
function fDistance(loc1,loc2){
  // Pass two locations in the form of the Location class --> returns distance in meters(float) between them
  //Derived from the haversine formula
  const radEarth = 6371e3;
  const phi1 = loc1.latitude * Math.PI / 180;
  const phi2 = loc2.latitude * Math.PI/180;
  const delphi = (loc2.latitude - loc1.latitude) * Math.PI/180;
  const dellam = (loc2.longitude - loc1.longitude) * Math.PI/180;
  const alpha = Math.sin(delphi/2) * Math.sin(delphi/2) + Math.cos(phi1) * Math.cos(phi2) * Math.sin(dellam / 2) * Math.sin(dellam/2);
  const ceta = 2 * Math.atan2(Math.sqrt(alpha),Math.sqrt(1-alpha));
  return ceta * radEarth
};

function cPos(mypos,locArray,distance){
//Takes mypos as a Location , locArray as an array in the form {location, location,....,location}, distance in meters(float)
// --> returns array of all ele of locArray st fDistance(mypos,loc) <= distance
  var retArray = new Array()
  for(ele of locArray){
    if( fDistance(mypos,ele) <= distance){
      retArray.push(ele);
    }
  }
  return retArray
};
function minDistance(pos,locArray){
// the pos as a location and an array of locations will return the location with the smallest distance
 var min = [10e25,1];
  for(loc of locArray){
    if(fDistance(pos,loc) < min[0]){
      min = (fDistance(pos,loc),loc);
    }
  }
  return min;
};

function bPerim(locArray){
  //takes a location Array and returns an array of periNodes that defines the perimeter of the shape
  //alg takes the min of the next possible distance
  var retArray = new Array();
  var ogArray = locArray;
  var lloc = null
  for(loc of locArray){
    var tloc = new periNode();
    tloc.location = loc;
    tloc.lastloc = lloc
    var minres = minDistance(loc,ogArray.filter(item => item != loc));
    ogArray = ogArray.filter(item => item != minres);
    tloc.nextloc = minres;
    retArray.push(tloc)
    lloc = tloc.location
  }
  retArray[retArray.length - 1].nextloc = retArray[0].location
  retArray[0].lastloc = retArray[retArray.length -1].location
  return retArray
};

function fgeoMid(locarray){
//this function takes the locations in the loc arrays and returns a location in the center
  var Xsum = 0;
  var Ysum = 0;
  var Zsum = 0;
  for (loc of locarray){
    var [lon,lat] = clocDrad(loc);
    Xsum += Math.cos(lat) * Math.cos(lon);
    Ysum += Math.cos(lat) * Math.sin(lon);
    Zsum += Math.sin(lat);
  }
  Xsum = Xsum / locarray.length
  Ysum = Ysum / locarray.length
  Zsum = Zsum / locarray.length

  var retLoc = new Location()
  retLoc.latitude = Math.atan2(Ysum,Xsum)*180/Math.PI;
  retLoc.longitude = Math.atan2(Zsum,Math.sqrt(Xsum*Xsum + Ysum * Ysum)) * 180/Math.PI;
  return retLoc
};
function clocDrad(location){
//takes a location and returns a tuple [lat,lon] as rads
  return [location.latitude * Math.PI/180, location.longitude * Math.PI/180]
};

function locaVect(centroid,location){
//takes in a location and a centroid, and returns unit vector from centreoid to location as a normalised 3vector
  var [lonc,latc] = clocDrad(centroid);
  var [lon,lat] = clocDrad(location);
  var Xhat = Math.cos(lat) * Math.cos(lon) - Math.cos(latc) * Math.cos(lonc);
  var Yhat = Math.cos(lat) * Math.sin(lon) - Math.cos(latc) * Math.sin(lonc);
  var Zhat = Math.sin(lat) - Math.sin(latc);
  const maghat = Math.sqrt(Xhat*Xhat+Yhat*Yhat+Zhat*Zhat);
  return [Xhat/maghat,Yhat/maghat,Zhat/maghat];
};

function vlocAdd(centroid,location,n){
//takes two locations being the center and the location and returns a new location n meters away in that direction
var roughRad = n/111111 * Math.PI/180;
var [lon,lat] = clocDrad(location);
var X = Math.cos(lat) * Math.cos(lon);
var Y = Math.cos(lat) * Math.sin(lon);
var Z = Math.sin(lat);
var vector = locaVect(centroid,location);
X += vector[0]*roughRad;
Y += vector[1]*roughRad;
Z += vector[2]*roughRad;

var retLoc = new Location()
retLoc.latitude = Math.atan2(Y,X)*180/Math.PI;
retLoc.longitude = Math.atan2(Z,Math.sqrt(X*X + Y*Y)) * 180/Math.PI;
return retLoc
};

function nlocArray(locarray,distance){
//given a  locarray and distance in m returns a new Nodes expanded by distance(can be negative) 
var centroid = fgeoMid(locarray);
var retArray = new Array();
  for (loc of locarray){
    retArray.push(vlocAdd(centroid,loc,distance))
  }
return retArray
};

function cPeridistance(perimeter){
  //Takes a perimeter of periNodes and returns the perimeter distance
  firstloc = perimeter[0].location;
  var distance = 0;
  for(peri of perimeter){
    distance += fDistance(peri.location,peri.nextloc);
  }
  return distance
};

function areaNpoly(perimeter){
//Takes a perimeter of periNodes and will return an int (m^2)
nVert = perimeter.length
sum1 = 0
sum2 = 0

for(i=0;i<nVert-1;i++){
  sum1 += locTcart(perimeter[i].location)[0]*locTcart(perimeter[i+1].location)[1]
  sum2+=locTcart(perimeter[i].location)[1]*locTcart(perimeter[i+1].location)[0]
}
sum1 += locTcart(perimeter[nVert-1].location)[0]*locTcart(perimeter[0].location)[1]
sum2 += locTcart(perimeter[0].location)[0]*locTcart(perimeter[nVert-1].location)[0]
return Math.abs(sum1-sum2)*0.5 *180/Math.PI*111111
};

function locTcart(location){
//Takes in a location and returns a 'tuple' of its [x,y]
  var [lon,lat] = clocDrad(location)
  return [Math.cos(lat)*Math.cos(lon),Math.cos(lat)*Math.sin(lon)];
};


function getCloc(locarray){
//Returns the comma seperated list of longitude latitude for a locarray
  var retString = "";
  for(loc of locarry){
    
    retString += "," + loc.longitude + "," + loc.latitude;
  };
  return retString
};
const loc1 = new Location(43.770967, -79.260767)
const loc2 = new Location(43.771038, -79.260805)
const loc3 = new Location(43.771071, -79.260675)
const loc4 = new Location(43.770999, -79.260639)

var locarry = [loc1,loc2,loc3,loc4]
