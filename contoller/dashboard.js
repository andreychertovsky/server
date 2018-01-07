const Extension = require('../models/extension');
const Account   = require('../models/account');
const User      = require('../models/user');

const Promise   = require('bluebird');
const config    = require('../config/config');
const redis     = require('redis');

Promise.promisifyAll(redis.RedisClient.prototype);

const client    = redis.createClient({ host:config.redis.host , port:config.redis.port });

module.exports = {
//
// ─── ACCOUNT METHOD ─────────────────────────────────────────────────────────────
//
    getAllAccount: async (req, res, next) => {
        try {
            const account = await Account.find({});
            res.status(200).json({
                account
            });
        } catch(err){
            next(err);
        }
    },

    createAccount: async (req, res, next) => {
        try {
            const newAccount = new Account(req.body);
            const account = await newAccount.save();
            res.status(201).json({
                success: true
            });
        } catch (err){
            next(err);
        }
    },

    getOneAccount: async (req, res, next) => {
        try {
            const {login} = req.params;
            const account = await Account.findOne({login:login})
            res.status(200).json({
                account
            });
        } catch(err) {
            next(err);
        }
    },

    updateAccount: async (req, res, next) => { // recive arbitrary new field
        try {
            const {login} = req.params;
            const newAccount = req.body;
            const account = await Account.findOneAndUpdate({login:login}, newAccount);
            res.status(200).json({
                success: true
            });
        } catch(err){
            next(err);
        }
    },

    getAllAccountExtension: async (req, res, next) => {
        try {
            const {login} = req.params;
            const account = await Account.findOne({login:login}).populate('extList'); //show extList insted of extListId
            res.status(200).json({
                account
            });
        } catch (err) {
            next(err);
        }
    }, 

    createAccountExtension: async (req, res, next) => {// ???????
        try {
            const {login} = req.params;
            const newExtension = new Extension(req.body); // create object to populate new extension fields
            const account = await Account.findOne({login:login}); // get account by id
            newExtension.owner = account; // assign account as a owner extension
            await newExtension.save(); // save extension
            account.extList.push(newExtension); // push saved extension to account array
            await account.save(); // save account
            res.status(200).json({
                success: true
            });
        } catch(err) {
            next(err);
        }
    },


//
// ─── EXTENSION METHOD ─────────────────────────────────────────────────────────────
//

    
    getAllExtension: async (req, res, next) => {
        try {
            const extension = await Extension.find({});
            res.status(200).json({
                extension
            });
        } catch(err){
            next(err);
        }
    },
    
    createExtension: async (req, res, next) => {
        try {
            const account = await Account.findOne( {login:req.body.owner} ); // lookup account owner
            const newExtension = req.body; //create new Ext
            delete newExtension.login; // removed because if already used above
            const extension = new Extension(newExtension); //create object
            extension.owner = account; //link to owner
            await extension.save(); //saved to db
            account.extList.push(extension); //push extension to account extension list
            await account.save();// save
            res.status(200).json({
                success: true
            });
        } catch(err){
            next(err);
        }
    }, 

    getOneExtension: async (req, res, next) => {
        try {
            const {id} = req.params;
            const extension = await Extension.findOne({id: id});
            res.status(200).json({
                extension
            });
        } catch (err) {
            next(err)
        }
    },

    updateExtension: async (req, res, next) => { // recive arbitrary new field
        try {
            const {id} = req.params;
            const newExtension = req.body;
            const extension = await Extension.findOneAndUpdate({id:id}, newExtension);
            res.status(200).json({
                success: true
            });
        } catch(err){
            next(err);
        }
    },

    deleteExtension: async (req, res, next) => {
        try {
            const {id} = req.params;
            const extension = await Extension.findOne({id:id});
            if (!extension) {
                 return res.status(404).json({
                    error: `Extension doesn't exist`
                });
            }
            const owner = extension.owner;
            const account = await Account.findById(owner);
            await extension.remove();
            account.extList.pull(extension);
            await account.save();
            res.status(200).json({
                success: true
            });
        } catch(err) {
            next(err);
        }
    },

    //
    // ─── PARTNER METHOD ─────────────────────────────────────────────────────────────
    //

    getAllPartner:  async (req, res, next) => {
        try {
            const result = await client.hgetallAsync('partners');
            res.status(200).json({
                result
            });
        } catch ( err ) {
            next(err);
        }
    },

    createOneParner: async (req, res, next) => {
        try {
            const {name, postback} = req.body;
            const partner = await client.hsetAsync('partners', name, postback);
            res.status(200).json({
                success: true
            }) ;
        } catch (err) {
            next(err);
        }
    },

    getOnePartner:  async (req, res, next) => {
        try {
            const {name} = req.params;
            const result = await client.hgetAsync('partners', name);
            return  res.status(200).json({
                result
            });
        } catch ( err ) {
            next(err);
        }
    },

    updateOneParner: async (req, res, next) => {
        try {
            const {name} = req.params;
            const {postback} = req.body;
            const partner = await client.hsetAsync('partners', name, postback);
            res.status(200).json({
                success: true
            }) ;
        } catch (err) {
            next(err);
        }
    },

    delOnePartner:  async (req, res, next) => {
        try {
            const {name} = req.params;
            await client.hdelAsync('partners', name);
            return  res.status(200).json({
                success: true
            });
        } catch ( err ) {
            next(err);
        }
    },

    //
    // ─── STATS METHOD ───────────────────────────────────────────────────────────────
    //

    statTraffic:  async (req, res, next) => {
        try {
            const result = await client.hgetAsync('stats', 'traffic-server');
            return res.status(200).json({
                result
            }) ;
        } catch ( err ) {
            next(err);
        }
    },

    statStatic: async (req, res, next) => {
        try {
            const result = await client.hgetAsync('stats', 'static-server');
            return res.status(200).json({
                result
            }) ;
        } catch ( err ) {
            next(err);
        }
    },

    getUrls: async (req, res, next) => {
        try {
            const result = await client.hgetallAsync('urls');
            return res.status(200).json({
                result
            });
        } catch ( err ) {
            next(err);
        }
    },

    getPbIntegration: async (req, res, next) => {
        try {
            const result = await client.keysAsync('postback-integration:*');
            return res.status(200).json({
                result
            });
        } catch ( err ) {
            next(err);
        }
    },

    getOnePbIntegration: async (req, res, next) => {
        try {
            const {name} = req.params;
            const result = await client.hgetallAsync(name);
            return res.status(200).json({
                result
            });
        } catch ( err ) {
            next(err);
        }
    },

    //
    // ─── USER METHOD ────────────────────────────────────────────────────────────────
    //

    getAllUser: async (req, res, next) => {
        try {
            const user = await User.find({});
            res.status(200).json({
                user
            });
        } catch (err) {
            next(err);
        }
    },

    getOneUser: async (req, res, next) => {
        try {
            const {username} = req.params;
            const user = await User.findOne({username});
            if (!user) {
                return res.status(404).json({
                    error: `User doesn't exist`
                });
            }
            res.status(200).json({
                user
            });
        } catch (err) {
            next(err);
        }
    },

    delOneUser: async (req, res, next) => {
        try {
            const {username} = req.params;
            const user = await User.findOne({username});
            if (!user) {
                return res.status(404).json({
                    error: 'User not exist'
                });
            }
            await user.remove();
            res.status(200).json({
                success: true
            });
        } catch (err) {
            next(err);
        }
    }

    //
    // ─── SPECIAL METHOD ─────────────────────────────────────────────────────────────
    //

}