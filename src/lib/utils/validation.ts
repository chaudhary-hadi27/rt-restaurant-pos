export const validate = {
    tableNumber: (val: string) => {
        const n = parseInt(val)
        if (!val || isNaN(n)) return 'Required'
        if (n < 1 || n > 999) return 'Must be 1-999'
        return null
    },
    capacity: (val: string) => {
        const n = parseInt(val)
        if (!val || isNaN(n)) return 'Required'
        if (n < 1 || n > 50) return 'Must be 1-50'
        return null
    },
    price: (val: string) => {
        const n = parseFloat(val)
        if (!val || isNaN(n)) return 'Required'
        if (n <= 0) return 'Must be positive'
        return null
    },
    phone: (val: string) => {
        if (!val) return 'Required'
        if (val.length < 10) return 'Invalid phone'
        return null
    },
    name: (val: string) => {
        if (!val?.trim()) return 'Required'
        if (val.length < 2) return 'Too short'
        return null
    }
}