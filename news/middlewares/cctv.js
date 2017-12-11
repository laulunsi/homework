
/* *
 * 爬取cctv内容
 *  */
const url = require('url'); //解析操作url
const superagent = require('superagent'); //这三个外部依赖不要忘记npm install
const cheerio = require('cheerio');
const eventproxy = require('eventproxy');
const XlsxPopulate = require('xlsx-populate');
/* 请求html页面 */
const fetchWebpage = (url) => {
    return new Promise((resolve,reject) => {
        superagent.get(url)
        .end((err,res) => {
            if(err){
                reject(err);
            }
            resolve(res.text);
        })
    })
}
/* url清洗 */
const clea_url = (str) => {
   return str.substring(str.indexOf('http'),str.indexOf('shtml') + 5);
}
/* 数据清洗*/
const washData = async(url) => {
    let result = await fetchWebpage(url);  
     let $ = cheerio.load(result);
     let arr = []
     $('#ccd li').each(function (idx, element) {
        let title = $('h3 a',element).text().trim();
        let text = $('p',element).text().trim();
        let source = $('span',element).first().text().substring(3).trim();
        let time = $('span',element).last().text().substring(5).trim();
        let url = clea_url($('h3 a',element).attr('href'));
        arr.push([title,text,source,time,url])
    });
    return arr;
}
const done = (num) => {
    return new Promise((resolve,reject) => {
        try{
            let _arr = [];
            for(let i =1 ;i<num+1;i++){
                _arr.push(i);
            }
            let _url ='http://search.cctv.com/search.php?qtext=%E5%A4%A9%E6%B4%A5%E7%88%86%E7%82%B8&type=web&datepid=1&vtime=-1&sort=relevance&page='
            Promise.all(_arr.map(i => washData(_url+i)))
            .then(res => {
                let arr = [];
                for(let i = 0;i<res.length;i++){
                    for(let j = 0;j<res[i].length;j++){
                        arr.push(res[i][j])
                    }
                }
                resolve(arr);
            });
        }catch(e){
        }
    })
}
const renderEXECL = async() => {
    let data = await done(75);
    let len = data.length+1;
    XlsxPopulate.fromBlankAsync()
        .then(workbook => {
            let sheet = workbook.sheet(0);
                sheet.column('A').width(60);
                sheet.column('B').width(100);
                sheet.column('C').width(15);
                sheet.column('D').width(15);
                sheet.column('E').width(25);
            let title = sheet.range("A1:E1");
                title.value([['标题','概述','新闻来源','发布时间','详情url']]);
            let rowValue = sheet.range("A2:E"+len);
                rowValue.value(data);
            return workbook.toFileAsync("./out.xlsx");
    });
}
renderEXECL();