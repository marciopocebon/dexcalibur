const Process = require("child_process");
const UT = require("./Utils.js");
const Device = require("./Device.js");

const TRANSPORT = {
    USB: 'U',
    WIFI: 'W',
    TCP: 'T'
};

const emuRE = /^emulator-/;


const DEV = {
    USB: 0x1,
    EMU: 0x2,
    ADB: 0x3,
    SDB: 0x4
};
const DEV_NAME = ['unknow','udb','emu','adb','sdb'];


const OS = {
    ANDROID: 0x0,
    LINUX: 0x1,
    TIZEN: 0x2
};
const OS_NAME = ['android','linux','tizen'];




class AdbWrapper
{
    constructor(adbpath,deviceID = null){
        this.transport = TRANSPORT.USB;
        this.path = adbpath;
        this.deviceID = (deviceID!=null) ? deviceID : null;
    }

    isReady(){
        return (this.path != null);
    }

    setup(deviceID = null){
        let cmd=this.path+" ";
        if(this.transport == TRANSPORT.USB){
            if(this.deviceID != null || deviceID != null)
                cmd += " -s "+this.deviceID;
        }else if(this.transport == TRANSPORT.TCP){
            cmd += " -e";
        }

        return cmd;
    }

    /**
     * Set the transport type
     */
    setTransport(transport_type){
        this.transport = transport_type;
    }

    listDevices(){
        let dev = [], ret=null,re=null, data=null, id=null, device=null;

        ret = Process.execSync(this.setup()+" devices -l").toString("ascii");
        ret = ret.split("\n");
        //re = new RegExp("([0-9A-Za-f]+).*device\susb:([^\s]+)\sproduct:([^\s]+)\smodel:([^\s]+)\sdevice:([^\s]+)");
        re = new RegExp("^([0-9A-Za-z-]+).*device (.*)$");
        
        for(let ln in ret){
            if(UT.trim(ret[ln]).length==0 
                || ret[ln]=="List of devices attached") 
                    continue;
    
            
            data =  re.exec(ret[ln]);
            if(data.length<3)
                continue;
    
            //console.log(data,ret[ln]);
            id = data[1];
            data = data[2].split(" ");
    
            device = new Device({
                type: OS.ANDROID,
                id: id,
                isEmulated: data[0].match(emuRE),
                bridge: new AdbWrapper(this.path, id),
                usb: data[0].substr(data[1].indexOf(":"),data[0].length),
                model: data[2].substr(data[2].indexOf(":"),data[2].length),
                product: data[1].substr(data[1].indexOf(":"),data[1].length)
            });

            if(device.isEmulated)
                device.bridge.setTransport(TRANSPORT.TCP);
            
            dev.push(device);
        }
        return dev;
    }

    /**
     * Pull a remote resource into the project workspace
     * Same as 'adb pull' commande.
     * 
     * @param {*} remote_path The path of the remote resource to download 
     * @param {*} local_path The path where the resource will be stored locally
     */
    pull(remote_path, local_path, deviceID=null){
        if(deviceID != null)
            return UT.execSync(this.setup(deviceID)+' pull '+remote_path+' '+local_path);
        else
            return UT.execSync(this.path+' pull '+remote_path+' '+local_path);
    }



    /**
     * Push a local resource to a remote location
     * Same as 'adb push' commande.
     * 
     * @param {*} local_path The path of the local resource to upload 
     * @param {*} remote_path The path where the resource will be stored remotely
     */
    push(local_path, remote_path){

        if(deviceID != null)
            return UT.execSync(this.setup(deviceID)+' push '+local_path+' '+remote_path);
        else
            return UT.execSync(this.path+' push '+local_path+' '+remote_path);
    }


    /**
     * Execute a command on the device
     * Same as 'adb shell' commande.
     * 
     * @param {*} command The command to execute remotely
     */
    shell(command){

        if(deviceID != null)
            return UT.execSync(this.setup(deviceID)+' shell '+command);
        else
            return UT.execSync(this.path+' shell '+command);

    }


    /**
     * Execute a command on the device via 'su -c'
     * Same as 'adb shell su -c' commande.
     * 
     * @param {*} command The command to execute remotely
     */
    privilegedShell(command){
        
        if(deviceID != null)
            return UT.execSync(this.setup(deviceID)+' shell su -c "'+command+'"');
        else
            return UT.execSync(this.path+' shell su -c "'+command+'"');
    }


}




module.exports = AdbWrapper;