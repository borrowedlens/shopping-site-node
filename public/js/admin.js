const deleteProduct = (btn) => {
    const productId = btn.parentNode.querySelector('[name=productId]').value;
    const _csrf = btn.parentNode.querySelector('[name=_csrf]').value;
    const productElement = btn.closest('.product-card');
    // console.log('deleteProduct -> productElement', productElement);

    fetch(`/admin/products/${productId}`, {
        method: 'DELETE',
        headers: {
            'csrf-token': _csrf,
        },
    })
        .then((result) => {
            productElement.parentNode.removeChild(productElement);
            return result.json();
        })
        .then((data) => {
            console.log('data', data);
        })
        .catch((err) => {
            console.log('err', err);
        });
};
