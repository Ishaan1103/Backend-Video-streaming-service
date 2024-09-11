export const asyncHandler = (requsetHandler) => async (req,res,next) => {
    Promise.resolve(requsetHandler(req,res,next)).catch(err=>next(err))
}