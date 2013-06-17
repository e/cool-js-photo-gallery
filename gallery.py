import Image

#opens an image:
im = Image.open("gallery.jpg")
#creates a new empty image, RGB mode, and size 400 by 400.
new_im = Image.new('RGB', (4400,510))

#Here I resize my opened image, so it is no bigger than 100,100
im.thumbnail((200,150))
#Iterate through a 4 by 4 grid with 100 spacing, to place my image
for i in xrange(20,4400,220):
    for j in xrange(20,510,170):
        #I change brightness of the images, just to emphasise they are unique copies.
        # im=Image.eval(im,lambda x: x+(i+j)/30)
        #paste the image at location i,j:
        new_im.paste(im, (i,j))

new_im.save('test.jpg')
