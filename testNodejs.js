const sqlite3 = require('sqlite3').verbose();
const { JSDOM } = require("jsdom");
const { window } = new JSDOM();

//---------------------------
//date: 19/11/2021
//content: 
//Get all data in database
//---------------------------
function getAll(sql){
    var data=[];
    return new Promise((resolve,reject)=>{
        let db = new sqlite3.Database('./ellipsys_test_db.db3');
        db.all(sql,[],(err,rows)=>{
          if(err){
              return console.error(err.message);
          }
          rows.forEach((row)=>{
              data.push(row);
          });
          resolve(data);
        })
        db.close();
    })
}

//---------------------------
//date: 19/11/2021
//content: 2 tasks: 
//(1)create "mapping" tables for each column of data table to store names
//(2)insert names with index into "mapping" tables for each column
//---------------------------
function createNewTable_insert(allChamp, allName){
    let db = new sqlite3.Database('./ellipsys_test_db.db3');
    for (let j = 0; j<allName.length; j++){
        db.serialize(function(){
            db.run("CREATE TABLE IF NOT EXISTS oa_trf_src_"+ allName[j] +"_lkp(id INTEGER, champ TEXT NOT NULL)");
            for (let i = 0; i< allChamp[j].length; i++){
                db.run("INSERT INTO oa_trf_src_"+ allName[j] +"_lkp VALUES ("+ i +", \'" + allChamp[j][i]+"\')");
            }
            console.log("done")
        });
    }
    db.close();
}

//---------------------------
//date: 19/11/2021
//content: 2 tasks: 
//(1)create a new optimized table for a original table using index (INTEGER)
//(2)insert index of data from the "mapping" tables (from the createNewTable_insert() function) for each columns
//---------------------------
function makeNewTableForData(AllData, AllChamp){
	let db = new sqlite3.Database('./ellipsys_test_db.db3');
    db.serialize(function(){
        db.run("CREATE TABLE IF NOT EXISTS oa_trf_src_red(id INTEGER, trf INTEGER, tgtTb INTEGER, tgtLab INTEGER, srcTb INTEGER, srcLab INTEGER, impact INTEGER)");
        AllData.forEach((row)=>{
            sqlInsert = "INSERT INTO oa_trf_src_red VALUES ("+AllChamp[0].indexOf(row.id)+","+AllChamp[1].indexOf(row.trf)+","+AllChamp[2].indexOf(row.tgtTb)+","+AllChamp[3].indexOf(row.tgtLab)+","+AllChamp[4].indexOf(row.srcTb)+","+AllChamp[5].indexOf(row.srcLab)+","+ parseInt(row.impact) +")";
            //console.log(sqlInsert);
            db.run(sqlInsert);
        });
        
    });
    db.close();
}

//-------------------
//date: 19/11/2021
//idea: 
//Get all data from the table and handle in NodeJS.
//Step1: collect all the values of each column and use Set() to obtain a unique set (unduplication).
//Step2: Create the "mapping" tables. (createNewTable_insert(allChamp, champName);)
//Step3: Create the new optimized table. (makeNewTableForData(allData,allChamp);)
(async function(){
	const start = window.performance.now()
    //Collect data
    sqlGetAll = "SELECT * FROM oa_trf_src";
    allData = await getAll(sqlGetAll);
	
    var id = [], trf = [], tgtTb = [], srcTb = [], srcLab = [], tgtLab = [];
    allData.forEach((row) => {
        id.push(row.id);
        trf.push(row.trf);
        tgtTb.push(row.tgtTb);
        srcTb.push(row.srcTb);
        tgtLab.push(row.tgtLab);
        srcLab.push(row.srcLab);
        //console.log(row)
    });

    //Make the unique sets (unduplication)
    let id_uni = [...new Set(id)];
    let trf_uni = [...new Set(trf)];
    let tgtTb_uni = [...new Set(tgtTb)];
    let srcTb_uni = [...new Set(srcTb)];
    let tgtLab_uni = [...new Set(tgtLab)];
    let srcLab_uni = [...new Set(srcLab)];
	
	
    champName = ['id','trf','tgtTb','tgtLab','srcTb','srcLab']
    allChamp = [id_uni, trf_uni, tgtTb_uni, tgtLab_uni, srcTb_uni, srcLab_uni];
    console.log("done data");
	const stop = window.performance.now()
	console.log("Time Taken to execute = " +((stop - start)/1000)+ "seconds");
	
    //Create the "mapping" tables.
    //createNewTable_insert(allChamp, champName);
	
    //Create the new optimized table.
    makeNewTableForData(allData,allChamp);
    

})();
