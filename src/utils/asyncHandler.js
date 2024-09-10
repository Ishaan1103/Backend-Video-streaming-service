const asyncHandler = (requsetHandler) => async (req,res,next) => {
    return Promise.resolve(requsetHandler(req,res,next)).catch(err=>next(err))
}