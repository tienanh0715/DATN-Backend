let messageError = {
    status:'fail',
    result:{}
  }
  let response = {
    result:{},
    status:'done'
  }
  
const callbackRes = (err,data,res) => {
    if(err) 
    {
        messageError.result=err
        return res.send(messageError)
    }
    else
    {
        response.result=data
        return res.send(response)
    }
}
const copyAndExcludes=(obj, notAllowed) =>
{
  let cloneObj= {...obj}
  return Object.keys(cloneObj)
    .filter(key => !notAllowed.includes(key))
    .reduce((_obj, key) => {
      _obj[key] = cloneObj[key];
      return _obj;
    }, {});
}
const isEmpty=(value) =>{
  return (typeof value == "undefined")
      || (typeof value == "string" && value.length == 0)
      || (typeof value == "number" && value == 0)
      || (typeof value == "boolean" && value == false)
      || ( value === null)
}

module.exports = {isEmpty,copyAndExcludes};