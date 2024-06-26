var express = require('express');
var router = express.Router();
var API_KEY = require('../public/javascripts/API')
const {create,getAll,getPlantsPagewise} = require('../controllers/sighting');
const sightingModel = require('../models/sighting');
const session = require('express-session');
var multer=require("multer")

router.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true
}));

var storage=multer.diskStorage({
    destination:function (req,file,cb){
        cb(null,'public/images/uploads')
    },
    fileName: function (req,file,cb){
        var original=file.originalname;
        var file_extension=original.split(".")
        filename=Date.now()+"."+file_extension[file_extension.length-1];
        cb(null,filename);
    }
});

let upload=multer({storage:storage,limits:{fieldSize: 25 * 1024*1024}})

router.get('/', async (req, res, next)=> {
    const page = parseInt(req.query.page) || 1;
    const limit = 8; // Number of plants per page
    const plants = await getPlantsPagewise(page, limit);
    const totalPlants = await sightingModel.countDocuments();
    const totalPages = Math.ceil(totalPlants / limit);
    res.render('index', {title: 'Botanical Lens', api: API_KEY, plants, currentPage: page, totalPages});
});

router.get('/contact-us', function (req, res, next) {
    res.render('contact', {title: 'Contact Us'});
});

router.get('/faq',function (req,res,next){
    res.render('faq',{title:'FAQs'})
})

router.get('/addplant', function (req, res, next) {
    res.render('addplant', {title: 'Add Plant'}); // Use 'addplant' as the EJS template file name
});

// route to get all plants
router.get('/plants', function (req, res, next) {
    getAll().then(todos => {
        return res.status(200).send(todos);
    }).catch(err => {
        console.log(err);
        res.status(500).send(err);
    });
})

router.get('/sightingdetails', (req, res) => {
    const sightingId  = req.query.sightingId;
    res.render('sightingdetails', { title: "Plants Details", sightingId: sightingId });
});

router.post('/addplant',upload.none(), (req, res) => {
    create(req.body).then(plant => {
            res.status(200).send(plant);
        }).catch(err => {
            res.status(500).send(err);
        });

});

module.exports = router;
